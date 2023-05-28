import { NextFunction, Request, Response } from "express";
import { User } from "../../models/user.model.js";
import { knativebus } from "knativebus";
import { config } from "../../config.js";

const bus = knativebus(config.bus);

export const find = (req: Request, res: Response, next: NextFunction) => {
  // If a query string ?address=... is given, then filter results
  const whereClause =
    req.query && req.query.address
      ? {
          where: { address: req.query.address },
        }
      : undefined;

  return User.findAll(whereClause)
    .then((users: User[]) => res.json(users))
    .catch(next);
};

export const get = (req: Request, res: Response, next: NextFunction) => {
  // AccessToken address is in req.user.address
  // address is the param in /users/:address
  // We only allow user accessing herself, i.e. require user.address==params.address
  if ((req as any).user.address !== +req.params.address) {
    return res.status(401).send({ error: "You can can only access yourself" });
  }
  return User.findByPk(req.params.address)
    .then((user: User | null) => res.json(user))
    .catch(next);
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.create(req.body);

    const event = "web3auth.user-created";
    await bus.publish(event, user);

    return res.json(user);
  } catch (err) {
    return next(err);
  }
};

export const patch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Only allow to fetch current user
  try {
    if ((req as any).user.address !== req.params.address) {
      return res
        .status(401)
        .send({ error: "You can can only access yourself" });
    }
    const user = await User.findByPk(req.params.address);

    if (!user) {
      return user;
    }

    Object.assign(user, req.body);
    await user.save();

    const event = "web3auth.user-updated";
    await bus.publish(event, user);

    if (user) {
      return res.json(user);
    } else {
      return res.status(401).send({
        error: `User with address ${req.params.address} is not found in database`,
      });
    }
  } catch (err) {
    return next(err);
  }
};
