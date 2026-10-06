const MINIMUM_PASSWORD_LENGTH = 8;

export function getPasswordValidationMessage(value: string): string | null {
  if (value.length < MINIMUM_PASSWORD_LENGTH) {
    return `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters.`;
  }

  if (!/[A-Z]/.test(value)) {
    return "Password must include at least one uppercase letter.";
  }

  if (!/[a-z]/.test(value)) {
    return "Password must include at least one lowercase letter.";
  }

  if (!/[0-9]/.test(value)) {
    return "Password must include at least one number.";
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return "Password must include at least one special character.";
  }

  return null;
}
