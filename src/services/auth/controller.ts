import { recoverPersonalSignature } from "@metamask/eth-sig-util";
import { bufferToHex } from "ethereumjs-util";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import debug from "debug";
import { config } from "../../config.js";
import { User } from "../../models/user.model.js";
import { RefreshToken } from "../../models/refreshToken.model.js";

const log = debug("web3auth");

const generateJWTs = async (user: User) => {
  // Step 1a Create Refresh Token JWT
  const jwtid = uuid();
  const refreshToken = await jwt.sign(
    {
      typ: "Refresh",
    },
    config.jwt.secret,
    {
      algorithm: config.jwt.algorithms[0],
      expiresIn: "2d",
      audience: config.publicURI,
      issuer: config.publicURI,
      subject: user.address,
      jwtid,
    }
  );

  // Step 1b: Store Refresh Token
  await RefreshToken.create({
    id: jwtid,
    address: user.address,
    token: refreshToken,
  });

  // Step 2: Create Id Token JWT
  const idToken = await jwt.sign(
    {
      address: user.address,
      username: user.username || user.address,
      roles: ["user"],
      typ: "Id",
    },
    config.jwt.secret,
    {
      algorithm: config.jwt.algorithms[0],
      expiresIn: "2d",
      audience: config.publicURI,
      issuer: config.publicURI,
      subject: user.address,
    }
  );

  // Step 3: Create Access Token JWT
  const accessToken = await jwt.sign(
    {
      address: user.address,
      username: user.username || user.address,
      "https://hasura.io/jwt/claims": {
        "x-hasura-user-id": user.address,
        "x-hasura-default-role": "user",
        "x-hasura-allowed-roles": ["user"],
      },
      typ: "Access",
    },
    config.jwt.secret,
    {
      algorithm: config.jwt.algorithms[0],
      expiresIn: "5m",
      audience: config.publicURI,
      issuer: config.publicURI,
      subject: user.address,
    }
  );

  return {
    accessToken,
    refreshToken,
    idToken,
  };
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { signature, address } = req.body;
    if (!signature || !address)
      return res
        .status(400)
        .send({ error: "Request should have signature and address" });

    // Step 1: Get the user with the given address
    const user: User | null = await User.findByPk(address);
    if (!user)
      return res.status(401).send({
        error: `User with address ${address} is not found in database`,
      });

    // Step 2: Verify digital signature
    // We now are in possession of msg, address and signature. We
    // will use a helper from @metamask/eth-sig-util to extract the address from the signature
    // The signature verification is successful if the recoveredAddress found with
    // sigUtil.recoverPersonalSignature matches the initial address
    const msg = `I am signing my one-time nonce: ${user.nonce}`;
    const data = bufferToHex(Buffer.from(msg, "utf8"));
    const recoveredAddress = recoverPersonalSignature({
      data,
      signature,
    });
    const signatureAddressMatchesUserAddress =
      recoveredAddress.toLowerCase() === address.toLowerCase();
    if (!signatureAddressMatchesUserAddress)
      return res.status(401).send({
        error: "Signature verification failed",
      });

    // Step 3: Generate a new nonce for the user
    user.nonce = uuid();
    await user.save();

    const tokens = await generateJWTs(user);

    return res.json({ ...tokens });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { address } = req.body;
    if (!address)
      return res.status(400).send({ error: "Request should have address" });

    const refreshTokens = await RefreshToken.findAll({
      where: {
        address,
        revoked: false,
      },
    });

    refreshTokens.forEach(async (unrevokedToken) => {
      log("Logout revoking token", unrevokedToken.id);
      unrevokedToken.revoked = true;
      await unrevokedToken.save();
    });

    return res.json({});
  } catch (err) {
    console.error(err);
    return next(err);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken)
      return res
        .status(400)
        .send({ error: "Request should have refreshToken" });

    let decodedJWT;
    try {
      decodedJWT = jwt.verify(refreshToken, config.jwt.secret);
    } catch (err) {
      return res.status(401).send({
        error: `RefreshToken Signature could not be verified`,
      });
    }

    const sub: string | undefined = decodedJWT.sub as string;
    const jwtid: string | undefined = (decodedJWT as any).jti as string;
    const address = sub;

    log("refreshing token for", sub, jwtid);

    const originalToken = await RefreshToken.findByPk(jwtid);

    if (!originalToken) {
      return res.status(401).send({
        error: `RefreshToken is not found in database`,
      });
    }

    if (originalToken.revoked) {
      return res.status(401).send({
        error: `RefreshToken has been revoked`,
      });
    }

    if (originalToken.token !== refreshToken) {
      return res.status(401).send({
        error: `RefreshToken doesn't match`,
      });
    }

    const user: User | null = await User.findByPk(address);

    if (!user)
      return res.status(401).send({
        error: `User with address ${address} is not found in database`,
      });

    const newTokenSet = await generateJWTs(user);

    setTimeout(() => {
      log("revoking redeemed token", originalToken.id);
      originalToken.revoked = true;
      originalToken.save();
    }, 30 * 1000);

    return res.json({ ...newTokenSet });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};
