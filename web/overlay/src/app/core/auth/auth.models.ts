export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: string;
  user: AuthenticatedUser;
}

export function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<AuthSession>;
  return typeof session.accessToken === 'string'
    && typeof session.expiresAt === 'string'
    && !!session.user
    && typeof session.user.id === 'string'
    && typeof session.user.email === 'string'
    && typeof session.user.fullName === 'string'
    && typeof session.user.role === 'string';
}

export function isSessionExpired(session: AuthSession): boolean {
  const expiresAt = Date.parse(session.expiresAt);
  return Number.isNaN(expiresAt) || expiresAt <= Date.now();
}
