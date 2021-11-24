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
      subject: user.publicAddress,
    }
  );

  // Step 1b: Store Refresh Token
  await RefreshToken.create({
    publicAddress: user.publicAddress,
    token: refreshToken,
  });

  // Step 2: Create Id Token JWT
  const idToken = await jwt.sign(
    {
      publicAddress: user.publicAddress,
      username: user.username || user.publicAddress,
      typ: "Id",
    },
    config.jwt.secret,
    {
      algorithm: config.jwt.algorithms[0],
      expiresIn: "2d",
      audience: config.publicURI,
      issuer: config.publicURI,
      subject: user.publicAddress,
    }
  );

  // Step 3: Create Access Token JWT
  const accessToken = await jwt.sign(
    {
      publicAddress: user.publicAddress,
      username: user.username || user.publicAddress,
      "https://hasura.io/jwt/claims": {
        "x-hasura-user-id": user.publicAddress,
        "x-hasura-default-role": "user",
      },
      typ: "Access",
    },
    config.jwt.secret,
    {
      algorithm: config.jwt.algorithms[0],
      expiresIn: "5m",
      audience: config.publicURI,
      issuer: config.publicURI,
      subject: user.publicAddress,
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
    const { signature, publicAddress } = req.body;
    if (!signature || !publicAddress)
      return res
        .status(400)
        .send({ error: "Request should have signature and publicAddress" });

    // Step 1: Get the user with the given publicAddress
    const user: User | null = await User.findByPk(publicAddress);
    if (!user)
      return res.status(401).send({
        error: `User with publicAddress ${publicAddress} is not found in database`,
      });

    // Step 2: Verify digital signature
    // We now are in possession of msg, publicAddress and signature. We
    // will use a helper from @metamask/eth-sig-util to extract the address from the signature
    // The signature verification is successful if the address found with
    // sigUtil.recoverPersonalSignature matches the initial publicAddress
    const msg = `I am signing my one-time nonce: ${user.nonce}`;
    const data = bufferToHex(Buffer.from(msg, "utf8"));
    const address = recoverPersonalSignature({
      data,
      signature,
    });
    const signatureAddressMatchesUserAddress =
      address.toLowerCase() === publicAddress.toLowerCase();
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
    const publicAddress = sub;

    log("refreshing token for", sub);

    const token = await RefreshToken.findByPk(refreshToken);

    if (!token) {
      return res.status(401).send({
        error: `RefreshToken is not found in database`,
      });
    }

    if (token.revoked) {
      return res.status(401).send({
        error: `RefreshToken has been revoked`,
      });
    }

    const user: User | null = await User.findByPk(publicAddress);

    if (!user)
      return res.status(401).send({
        error: `User with publicAddress ${publicAddress} is not found in database`,
      });

    const tokens = await generateJWTs(user);

    return res.json({ ...tokens });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};
