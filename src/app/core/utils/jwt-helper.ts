/**
 * Utility functions for JWT token inspection and debugging
 */

export interface JwtPayload {
  [key: string]: any;
  sub?: string;
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  full_name?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string;
}

/**
 * Decode JWT token without verification (for debugging)
 */
export function decodeJwtToken(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Get all claims from the JWT token
 */
export function getTokenClaims(token: string): JwtPayload | null {
  return decodeJwtToken(token);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtToken(token);
  if (!payload || !payload.exp) {
    return true;
  }
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  return Date.now() >= expirationTime;
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeJwtToken(token);
  if (!payload || !payload.exp) {
    return null;
  }
  return new Date(payload.exp * 1000);
}

