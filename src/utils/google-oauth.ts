const DEFAULT_LOCAL_GOOGLE_REDIRECT_URI = "http://127.0.0.1:4173/auth/callback";
const LEGACY_LOCAL_GOOGLE_REDIRECT_URI = "http://localhost:3001/auth/callback";

const parseCsv = (value: string): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

const unique = (list: string[]): string[] => [...new Set(list)];

const getCurrentOriginRedirectUri = (): string | null => {
  if (typeof window === "undefined" || !window.location?.origin) {
    return null;
  }
  return `${window.location.origin}/auth/callback`;
};

/**
 * Get all supported redirect URIs (additive, does not drop existing ones).
 */
export const getGoogleRedirectUris = (): string[] => {
  const csvUris = parseCsv((import.meta.env.VITE_GOOGLE_REDIRECT_URIS || "").trim());
  const singleUri = (import.meta.env.VITE_GOOGLE_REDIRECT_URI || "").trim();
  const currentOriginUri = getCurrentOriginRedirectUri();

  const uris = [
    ...csvUris,
    singleUri,
    currentOriginUri,
    DEFAULT_LOCAL_GOOGLE_REDIRECT_URI,
    LEGACY_LOCAL_GOOGLE_REDIRECT_URI,
  ].filter((uri): uri is string => Boolean(uri));

  return unique(uris);
};

/**
 * Resolve Google OAuth redirect URI from env or current runtime origin.
 */
export const getGoogleRedirectUri = (): string => {
  const uris = getGoogleRedirectUris();
  const currentOriginUri = getCurrentOriginRedirectUri();

  if (currentOriginUri && uris.includes(currentOriginUri)) {
    return currentOriginUri;
  }

  return uris[0] || DEFAULT_LOCAL_GOOGLE_REDIRECT_URI;
};

/**
 * Normalize authorization URL so redirect_uri always matches the frontend callback.
 */
export const withGoogleRedirectUri = (authorizationUrl: string, redirectUri = getGoogleRedirectUri()): string => {
  if (!authorizationUrl) return authorizationUrl;

  try {
    const url = new URL(authorizationUrl);
    const currentRedirectUri = url.searchParams.get("redirect_uri");
    const currentOriginUri = getCurrentOriginRedirectUri();

    // Keep existing redirect only when it already matches current frontend callback.
    if (currentRedirectUri && currentRedirectUri === currentOriginUri) {
      return url.toString();
    }

    url.searchParams.set("redirect_uri", redirectUri);
    return url.toString();
  } catch {
    return authorizationUrl;
  }
};
