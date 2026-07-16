export interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  if (password.length < 8) {
    return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe tener al menos una letra mayúscula.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe tener al menos una letra minúscula.' };
  }
  if (!/\d/.test(password)) {
    return { isValid: false, error: 'La contraseña debe tener al menos un número.' };
  }
  return { isValid: true };
}
