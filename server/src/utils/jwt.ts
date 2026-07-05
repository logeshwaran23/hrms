import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config';

export interface TokenPayload {
  userId: string;
  employeeId: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): JwtPayload & { userId: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload & { userId: string };
}
