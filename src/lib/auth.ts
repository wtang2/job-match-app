import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from './db';
import { User } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'job-search-super-secret-key-2026';

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return checkHash === hash;
}

export function createAuthToken(userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyAuthToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (expectedSig !== signature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return decoded.sub;
  } catch (err) {
    return null;
  }
}

export function getUserIdFromRequest(req: NextRequest): string | null {
  // Check cookie first
  const cookie = req.cookies.get('job_search_auth')?.value;
  if (cookie) {
    const userId = verifyAuthToken(cookie);
    if (userId) return userId;
  }

  // Check Authorization header
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const userId = verifyAuthToken(token);
    if (userId) return userId;
  }

  return null;
}

export function getCurrentUser(req: NextRequest): User | null {
  const userId = getUserIdFromRequest(req);
  if (!userId) return null;
  return getUserById(userId);
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set('job_search_auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set('job_search_auth', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  });
}
