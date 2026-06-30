import { AuthPayload, UserRole } from '../middleware/authMiddleware';

const encodeBase64Url = (value: string): string => {
  const binary = globalThis.btoa
    ? globalThis.btoa(value)
    : Buffer.from(value, 'binary').toString('base64');
  return binary.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Mints a locally-signed-looking JWT for the demo/onboarding flow until a real
 * auth backend is wired up. Never used to authorize server requests.
 */
export const createDemoToken = (role: UserRole = 'Driver', email = 'driver@princehaulintelligence.com'): string => {
  const header = encodeBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload: AuthPayload = {
    userId: `demo-${Date.now()}`,
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };
  const body = encodeBase64Url(JSON.stringify(payload));
  return `${header}.${body}.demo`;
};
