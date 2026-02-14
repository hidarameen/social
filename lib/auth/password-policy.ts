export function hasStrongPassword(password: string): boolean {
  return (
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function getPasswordPolicyError(): string {
  return 'Password must include uppercase, lowercase, number, and special character.';
}
