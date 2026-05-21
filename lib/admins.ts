/** Keep in sync with isAdmin() in firestore.rules */
export const ADMIN_EMAILS = [
  'kolsen29@burrburton.org',
  'ebuikema29@burrburton.org',
  'mwohlleber29@burrburton.org',
] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (ADMIN_EMAILS as readonly string[]).includes(email);
}
