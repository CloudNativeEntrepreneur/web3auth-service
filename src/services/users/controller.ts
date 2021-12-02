import { NextFunction, Request, Response } from "express";
import { User } from "../../models/user.model.js";

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

export const create = (req: Request, res: Response, next: NextFunction) =>
  User.create(req.body)
    .then((user: User) => res.json(user))
    .catch(next);

export const patch = (req: Request, res: Response, next: NextFunction) => {
  // Only allow to fetch current user
  if ((req as any).user.address !== +req.params.address) {
    return res.status(401).send({ error: "You can can only access yourself" });
  }
  return User.findByPk(req.params.address)
    .then((user: User | null) => {
      if (!user) {
        return user;
      }

      Object.assign(user, req.body);
      return user.save();
    })
    .then((user: User | null) => {
      return user
        ? res.json(user)
        : res.status(401).send({
            error: `User with address ${req.params.address} is not found in database`,
          });
    })
    .catch(next);
};
