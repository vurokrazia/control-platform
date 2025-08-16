// Password strength utilities
export const passwordStrength = {
  /**
   * Calculate password strength (0-100)
   */
  calculate(password: string): number {
    let strength = 0;
    
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    return strength;
  },

  /**
   * Get strength label key for translation
   */
  getLabel(strength: number): string {
    if (strength < 25) return 'auth.register.passwordStrengthVeryWeak';
    if (strength < 50) return 'auth.register.passwordStrengthWeak';
    if (strength < 75) return 'auth.register.passwordStrengthGood';
    return 'auth.register.passwordStrengthStrong';
  },

  /**
   * Get Bootstrap variant for strength
   */
  getVariant(strength: number): string {
    if (strength < 25) return 'danger';
    if (strength < 50) return 'warning';
    if (strength < 75) return 'info';
    return 'success';
  }
};