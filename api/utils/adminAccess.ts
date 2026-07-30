export function normaliseEmail(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

export function isApprovedAdminEmail(
  email: string,
): boolean {
  const approvedEmails =
    process.env.ADMIN_EMAILS
      ?.split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean) ?? [];

  return approvedEmails.includes(
    email.trim().toLowerCase(),
  );
}

export function isCorrectRegistrationCode(
  code: unknown,
): boolean {
  const expectedCode =
    process.env.ADMIN_REGISTRATION_CODE;

  if (!expectedCode) {
    throw new Error(
      'ADMIN_REGISTRATION_CODE is not configured',
    );
  }

  return String(code ?? '') === expectedCode;
}