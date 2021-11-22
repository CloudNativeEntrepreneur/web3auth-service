import { recoverPersonalSignature } from "eth-sig-util";
import { bufferToHex } from "ethereumjs-util";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { config } from "../../config";
import { User } from "../../models/user.model";
import { RefreshToken } from "../../models/refreshToken.model";
import debug from "debug";

const log = debug("web3auth");

export const create = (req: Request, res: Response, next: NextFunction) => {
  const { signature, publicAddress } = req.body;
  if (!signature || !publicAddress)
    return res
      .status(400)
      .send({ error: "Request should have signature and publicAddress" });

  return (
    User.findByPk(publicAddress)
      ////////////////////////////////////////////////////
      // Step 1: Get the user with the given publicAddress
      ////////////////////////////////////////////////////
      .then((user: User | null) => {
        if (!user) {
          res.status(401).send({
            error: `User with publicAddress ${publicAddress} is not found in database`,
          });

          return null;
        }

        return user;
      })
      ////////////////////////////////////////////////////
      // Step 2: Verify digital signature
      ////////////////////////////////////////////////////
      .then((user: User | null) => {
        if (!(user instanceof User)) {
          // Should not happen, we should have already sent the response
          throw new Error('User is not defined in "Verify digital signature".');
        }

        const msg = `I am signing my one-time nonce: ${user.nonce}`;

        // We now are in possession of msg, publicAddress and signature. We
        // will use a helper from eth-sig-util to extract the address from the signature
        const msgBufferHex = bufferToHex(Buffer.from(msg, "utf8"));
        const address = recoverPersonalSignature({
          data: msgBufferHex,
          sig: signature,
        });

        // The signature verification is successful if the address found with
        // sigUtil.recoverPersonalSignature matches the initial publicAddress
        if (address.toLowerCase() === publicAddress.toLowerCase()) {
          return user;
        } else {
          res.status(401).send({
            error: "Signature verification failed",
          });

          return null;
        }
      })
      ////////////////////////////////////////////////////
      // Step 3: Generate a new nonce for the user
      ////////////////////////////////////////////////////
      .then((user: User | null) => {
        if (!(user instanceof User)) {
          // Should not happen, we should have already sent the response

          throw new Error(
            'User is not defined in "Generate a new nonce for the user".'
          );
        }

        user.nonce = uuid();
        return user.save();
      })
      ////////////////////////////////////////////////////
      // Step 4: Create JWTs
      ////////////////////////////////////////////////////
      // ---
      ////////////////////////////////////////////////////
      // Step 4a-1: Create Refresh Token JWT
      ////////////////////////////////////////////////////
      .then((user: User) => {
        return new Promise<any>((resolve, reject) =>
          // https://github.com/auth0/node-jsonwebtoken
          jwt.sign(
            {
              typ: "Refresh",
            },
            config.jwt.secret,
            {
              algorithm: config.jwt.algorithms[0],
              expiresIn: "2d",
              audience: config.publicURI,
              issuer: config.publicURI,
              subject: publicAddress,
            },
            (err, refreshToken) => {
              if (err) {
                return reject(err);
              }
              if (!refreshToken) {
                return new Error("Empty token");
              }
              const tokens = {
                refreshToken,
              };
              return resolve({ user, tokens });
            }
          )
        );
      })
      ////////////////////////////////////////////////////
      // Step 4a-2: Store Refresh Token
      ////////////////////////////////////////////////////
      .then((options: { user: User; tokens: { refreshToken: string } }) => {
        return new Promise<any>(async (resolve, reject) => {
          await RefreshToken.create({
            userPublicAddress: options.user.publicAddress,
            token: options.tokens.refreshToken,
          });

          return resolve(options);
        });
      })
      ////////////////////////////////////////////////////
      // Step 4b: Create Id Token JWT
      ////////////////////////////////////////////////////
      .then((options: { user: User; tokens: { refreshToken: string } }) => {
        return new Promise<any>((resolve, reject) =>
          // https://github.com/auth0/node-jsonwebtoken
          jwt.sign(
            {
              publicAddress,
              username: options.user.username || publicAddress,
              typ: "Id",
            },
            config.jwt.secret,
            {
              algorithm: config.jwt.algorithms[0],
              expiresIn: "2d",
              audience: config.publicURI,
              issuer: config.publicURI,
              subject: publicAddress,
            },
            (err, idToken) => {
              if (err) {
                return reject(err);
              }
              if (!idToken) {
                return new Error("Empty token");
              }
              const newTokens = {
                ...options.tokens,
                idToken,
              };
              return resolve({ user: options.user, tokens: newTokens });
            }
          )
        );
      })
      ////////////////////////////////////////////////////
      // Step 4c: Create Access Token JWT
      ////////////////////////////////////////////////////
      .then(
        (options: {
          user: User;
          tokens: {
            idToken: string;
            refreshToken: string;
          };
        }) => {
          return new Promise<any>((resolve, reject) =>
            // https://github.com/auth0/node-jsonwebtoken
            jwt.sign(
              {
                publicAddress,
                username: options.user.username || publicAddress,
                "https://hasura.io/jwt/claims": {
                  "x-hasura-user-id": publicAddress,
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
                subject: publicAddress,
              },
              (err, accessToken) => {
                if (err) {
                  return reject(err);
                }
                if (!accessToken) {
                  return new Error("Empty token");
                }
                const newTokens = {
                  ...options.tokens,
                  accessToken,
                };
                return resolve(newTokens);
              }
            )
          );
        }
      )
      .then(
        (tokens: {
          accessToken: string;
          idToken: string;
          refreshToken: string;
        }) => res.json({ ...tokens })
      )
      .catch(next)
  );
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(400).send({ error: "Request should have refreshToken" });

  let decodedJWT;
  try {
    decodedJWT = jwt.verify(refreshToken, config.jwt.secret);
  } catch (err) {
    return res.status(401).send({
      error: `RefreshToken Signature could not be verified`,
    });
  }

  let sub: string | undefined = decodedJWT.sub as string;
  let publicAddress = sub;

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

  const user = await User.findByPk(publicAddress);

  const newRefreshToken = await jwt.sign(
    { typ: "Refresh" },
    config.jwt.secret,
    {
      algorithm: config.jwt.algorithms[0],
      expiresIn: "2d",
      audience: config.publicURI,
      issuer: config.publicURI,
      subject: publicAddress,
    }
  );

  await RefreshToken.create({
    userPublicAddress: publicAddress,
    token: newRefreshToken,
  });

  const idToken = await jwt.sign(
    {
      publicAddress,
      username: user?.username || publicAddress,
      typ: "Id",
    },
    config.jwt.secret,
    {
      algorithm: config.jwt.algorithms[0],
      expiresIn: "2d",
      audience: config.publicURI,
      issuer: config.publicURI,
      subject: publicAddress,
    }
  );

  const accessToken = await jwt.sign(
    {
      publicAddress,
      username: user?.username || publicAddress,
      "https://hasura.io/jwt/claims": {
        "x-hasura-user-id": publicAddress,
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
      subject: publicAddress,
    }
  );

  return res.send({
    accessToken,
    refreshToken: newRefreshToken,
    idToken,
  });
};
