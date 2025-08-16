// Form validation utilities
export interface ValidationErrors {
  [key: string]: string | undefined;
}

export const authValidation = {
  /**
   * Validate email format
   */
  validateEmail(email: string, t: (key: string) => string): string | undefined {
    if (!email.trim()) {
      return t('auth.validation.emailRequired');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return t('auth.validation.emailInvalid');
    }
    return undefined;
  },

  /**
   * Validate password
   */
  validatePassword(password: string, t: (key: string) => string): string | undefined {
    if (!password) {
      return t('auth.validation.passwordRequired');
    }
    if (password.length < 6) {
      return t('auth.validation.passwordMinLength');
    }
    return undefined;
  },

  /**
   * Validate name
   */
  validateName(name: string, t: (key: string) => string): string | undefined {
    if (!name.trim()) {
      return t('auth.validation.nameRequired');
    }
    if (name.trim().length < 2) {
      return t('auth.validation.nameMinLength');
    }
    return undefined;
  },

  /**
   * Validate password confirmation
   */
  validatePasswordConfirmation(password: string, confirmPassword: string, t: (key: string) => string): string | undefined {
    if (!confirmPassword) {
      return t('auth.validation.confirmPasswordRequired');
    }
    if (password !== confirmPassword) {
      return t('auth.validation.passwordMismatch');
    }
    return undefined;
  },

  /**
   * Validate login form
   */
  validateLoginForm(email: string, password: string, t: (key: string) => string): ValidationErrors {
    return {
      email: this.validateEmail(email, t),
      password: this.validatePassword(password, t)
    };
  },

  /**
   * Validate register form
   */
  validateRegisterForm(name: string, email: string, password: string, confirmPassword: string, t: (key: string) => string): ValidationErrors {
    return {
      name: this.validateName(name, t),
      email: this.validateEmail(email, t),
      password: this.validatePassword(password, t),
      confirmPassword: this.validatePasswordConfirmation(password, confirmPassword, t)
    };
  }
};