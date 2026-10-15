import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type Session = { userId: string; role: string; expiresAt: number };
const sessions = new Map<string, Session>();

export type AuthenticatedIdentity = { userId: string; role: string };

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
};

export const verifyPassword = async (password: string, stored: string) => {
  const [scheme, saltHex, keyHex] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;
  try {
    const expected = Buffer.from(keyHex, 'hex');
    const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
};

export const createSession = (userId: string, role: string) => {
  const token = randomBytes(32).toString('base64url');
  sessions.set(token, { userId, role, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
};

export const getSession = (token: string | undefined): AuthenticatedIdentity | null => {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { userId: session.userId, role: session.role };
};

export const revokeSession = (token: string | undefined) => {
  if (token) sessions.delete(token);
};
