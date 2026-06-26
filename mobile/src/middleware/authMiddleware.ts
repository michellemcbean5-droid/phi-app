export type UserRole = 'CEO' | 'Admin' | 'Driver';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
}

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = globalThis.atob ? globalThis.atob(padded) : padded;

  return decodeURIComponent(
    binary
      .split('')
      .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  );
};

export const validateJWT = (token: string): AuthPayload | null => {
  if (!token.trim()) {
    return null;
  }

  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(segments[1])) as AuthPayload;
    if (!payload.userId || !payload.role || payload.exp * 1000 <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

const roleHierarchy: Record<UserRole, number> = {
  Driver: 1,
  Admin: 2,
  CEO: 3,
};

export const requireRole = (role: UserRole) => (token: string): boolean => {
  const payload = validateJWT(token);
  return payload ? roleHierarchy[payload.role] >= roleHierarchy[role] : false;
};
