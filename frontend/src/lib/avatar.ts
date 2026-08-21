/**
 * GET /users/me returns a MinIO presigned URL in `avatar` when a photo exists.
 * Object names stay in the database; they are not browser URLs.
 */

export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const AVATAR_ACCEPT = ALLOWED_AVATAR_TYPES.join(",");

/** Matches backend settings.MAX_FILE_SIZE */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function isAllowedAvatarType(type: string): boolean {
  return (ALLOWED_AVATAR_TYPES as readonly string[]).includes(type);
}

export function resolveAvatarSrc(avatar: string | null | undefined): string | undefined {
  if (!avatar) {
    return undefined;
  }

  if (/^https?:\/\//i.test(avatar)) {
    return avatar;
  }

  return undefined;
}
