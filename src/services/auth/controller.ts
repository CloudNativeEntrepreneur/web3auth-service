import { recoverPersonalSignature } from 'eth-sig-util';
import { bufferToHex } from 'ethereumjs-util';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid'

import { config } from '../../config';
import { User } from '../../models/user.model';

export const create = (req: Request, res: Response, next: NextFunction) => {
	const { signature, publicAddress } = req.body;
	if (!signature || !publicAddress)
		return res
			.status(400)
			.send({ error: 'Request should have signature and publicAddress' });

	return (
		User.findOne({ where: { publicAddress } })
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
					throw new Error(
						'User is not defined in "Verify digital signature".'
					);
				}

				const msg = `I am signing my one-time nonce: ${user.nonce}`;

				// We now are in possession of msg, publicAddress and signature. We
				// will use a helper from eth-sig-util to extract the address from the signature
				const msgBufferHex = bufferToHex(Buffer.from(msg, 'utf8'));
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
						error: 'Signature verification failed',
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

				user.nonce = Math.floor(Math.random() * 10000);
				return user.save();
			})
			////////////////////////////////////////////////////
			// Step 4: Create JWTs
			////////////////////////////////////////////////////
			// ---
			////////////////////////////////////////////////////
			// Step 4a: Create Refresh Token JWT
			////////////////////////////////////////////////////
			.then((user: User) => {
				return new Promise<any>((resolve, reject) =>
					// https://github.com/auth0/node-jsonwebtoken
					jwt.sign(
						{
							typ: "Refresh",
						},
						config.secret,
						{
							algorithm: config.algorithms[0],
							expiresIn: '2d',
							audience: config.publicURI,
							issuer: config.publicURI,
							jwtid: uuid(),
							subject: publicAddress
						},
						(err, token) => {
							if (err) {
								return reject(err);
							}
							if (!token) {
								return new Error('Empty token');
							}
							const tokens = {
								refreshToken: {
									token
								}
							}
							return resolve({ user, tokens });
						}
					)
				);
			})
			////////////////////////////////////////////////////
			// Step 4b: Create Id Token JWT
			////////////////////////////////////////////////////
			.then((options: { user: User, tokens: { refreshToken: { token: string } } }) => {
				return new Promise<any>((resolve, reject) =>
					// https://github.com/auth0/node-jsonwebtoken
					jwt.sign(
						{
							publicAddress,
							username: options.user.username || publicAddress,
							typ: "Id",
						},
						config.secret,
						{
							algorithm: config.algorithms[0],
							expiresIn: '2d',
							audience: config.publicURI,
							issuer: config.publicURI,
							jwtid: uuid(),
							subject: publicAddress
						},
						(err, idToken) => {
							if (err) {
								return reject(err);
							}
							if (!idToken) {
								return new Error('Empty token');
							}
							const newTokens = {
								...options.tokens,
								idToken: {
									token: idToken
								}
							}
							return resolve({ user: options.user, tokens: newTokens });
						}
					)
				);
			})
			////////////////////////////////////////////////////
			// Step 4c: Create Access Token JWT
			////////////////////////////////////////////////////
			.then((options: {
				user: User,
				tokens: {
					refreshToken: { token: string },
					idToken: { token: string }
				}
			}) => {
				return new Promise<any>((resolve, reject) =>
					// https://github.com/auth0/node-jsonwebtoken
					jwt.sign(
						{
							// TODO: payload is only for react frontend demo
							// this can be removed once that is no longer useful
							payload: {
								id: options.user.id,
								publicAddress,
							},
							publicAddress,
							username: options.user.username || publicAddress,
							"https://hasura.io/jwt/claims": {
								"x-hasura-user-id": publicAddress,
								"x-hasura-default-role": "user"
							},
							typ: "Access",
						},
						config.secret,
						{
							algorithm: config.algorithms[0],
							expiresIn: '5m',
							audience: config.publicURI,
							issuer: config.publicURI,
							jwtid: uuid(),
							subject: publicAddress
						},
						(err, accessToken) => {
							if (err) {
								return reject(err);
							}
							if (!accessToken) {
								return new Error('Empty token');
							}
							const newTokens = {
								...options.tokens,
								accessToken: {
									token: accessToken
								}
							}
							return resolve(newTokens);
						}
					)
				);
			})
			.then((tokens: {
				idToken: { token: string, expiry: number }
				accessToken: { token: string, expiry: number },
				refreshToken: { token: string, expiry: number }
			}) =>
				res
					.json({ ...tokens }))
			.catch(next)
	);
};
