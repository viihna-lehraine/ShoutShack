import argon2 from 'argon2';
import { Request } from 'express';
import { Socket } from 'net';

export const emailSecureAsBoolean: boolean =
	process.env.EMAIL_SECURE === 'true' || 'True' || 'TRUE' ? true : false;
export const fidoAuthRequireResidentKeyAsBoolean: boolean =
	process.env.FIDO_AUTH_REQUIRE_RESIDENT_KEY === 'true' || 'True' || 'TRUE'
		? true
		: false;
export const fidoCryptoParamsAsArray: number[] = JSON.parse(
	process.env.FIDO_CRYPTO_PARAMS || '[]'
);

export const blankRequest: Request = {
	headers: {},
	ip: '',
	socket: {
		remoteAddress: '0.0.0.0'
	} as Socket
} as Request;

export const hashConfig = {
	type: argon2.argon2id,
	memoryCost: 48640,
	timeCost: 4,
	parallelism: 1
};

export const sensitiveFields: string[] = [
	'email',
	'key',
	'newPassword',
	'oldPassword',
	'passphrase',
	'password',
	'totpSecret',
	'email2faToken',
	'email2faTokenExpires',
	'secret',
	'token',
	'username'
];

export const tlsCiphers: string[] = [
	'ECDHE-ECDSA-AES256-GCM-SHA384',
	'ECDHE-RSA-AES256-GCM-SHA384',
	'ECDHE-ECDSA-CHACHA20-POLY1305',
	'ECDHE-RSA-CHACHA20-POLY1305',
	'ECDHE-ECDSA-AES128-GCM-SHA256',
	'ECDHE-RSA-AES128-GCM-SHA256',
	'ECDHE-ECDSA-AES256-SHA384',
	'ECDHE-RSA-AES256-SHA384',
	'ECDHE-ECDSA-AES128-SHA256',
	'ECDHE-RSA-AES128-SHA256'
];
