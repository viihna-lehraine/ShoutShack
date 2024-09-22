import argon2 from 'argon2';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import xss from 'xss';
import createTOTPUtil from '../auth/totpMFA';
import { Logger } from '../utils/logger';
import { getTransporter } from '../services/mailer';
import generateConfirmationEmailTemplate from '../templates/confirmationEmailTemplate';
export interface UserSecrets {
    JWT_SECRET: string;
    PEPPER: string;
}
export interface UserRoutesModel {
    validatePassword: (password: string, logger: Logger) => boolean;
    findOne: (criteria: object) => Promise<UserInstance | null>;
    create: (user: Partial<UserInstance>) => Promise<UserInstance>;
}
interface UserInstance {
    id: string;
    userid: number;
    username: string;
    password: string;
    email: string;
    isAccountVerified: boolean;
    resetPasswordToken: string | null;
    resetPasswordExpires: Date | null;
    isMfaEnabled: boolean;
    creationDate: Date;
    comparePassword: (password: string, argon2: typeof import('argon2'), secrets: UserSecrets) => Promise<boolean>;
    save: () => Promise<void>;
}
interface UserRouteDependencies {
    logger: Logger;
    secrets: UserSecrets;
    UserRoutes: UserRoutesModel;
    argon2: typeof argon2;
    jwt: typeof jwt;
    axios: typeof axios;
    bcrypt: typeof bcrypt;
    uuidv4: typeof uuidv4;
    xss: typeof xss;
    generateConfirmationEmailTemplate: typeof generateConfirmationEmailTemplate;
    getTransporter: typeof getTransporter;
    totpUtil: ReturnType<typeof createTOTPUtil>;
}
export default function initializeUserRoutes({ logger, secrets, UserRoutes, argon2, jwt, axios, bcrypt, uuidv4, xss, generateConfirmationEmailTemplate, getTransporter, totpUtil }: UserRouteDependencies): Router;
export {};
//# sourceMappingURL=userRoutes.d.ts.map
