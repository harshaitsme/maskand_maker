export const DEFAULT_ADMIN_EMAILS: string[] = [
  "kushanherath59@gmail.com",
];

export const getAdminEmails = (): string[] => {
  const envAdmins = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    : [];

  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...envAdmins]));
};

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const admins = getAdminEmails();
  return admins.includes(normalized);
}
