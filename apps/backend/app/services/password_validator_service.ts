import zxcvbn from 'zxcvbn';

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  errors: string[];
  feedback: {
    suggestions: string[];
    warning: string | null;
  };
}

export class PasswordValidatorService {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 100;
  private static readonly MIN_SCORE = 2; // Require at least "fair" strength (score 2)

  /**
   * Validate password strength using zxcvbn
   * Note: Better Auth Have I Been Pwned plugin handles compromised password checks
   */
  static validate(password: string): PasswordValidationResult {
    const errors: string[] = [];

    // Length validation
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters`);
    }
    if (password.length > this.MAX_LENGTH) {
      errors.push(`Password must be no more than ${this.MAX_LENGTH} characters`);
    }

    // Use zxcvbn for strength scoring
    const result = zxcvbn(password);

    // Require minimum strength
    if (result.score < this.MIN_SCORE) {
      errors.push('Password is too weak. Please use a stronger password.');
    }

    return {
      isValid: errors.length === 0 && result.score >= this.MIN_SCORE,
      score: result.score,
      errors,
      feedback: {
        suggestions: result.feedback.suggestions || [],
        warning: result.feedback.warning || null,
      },
    };
  }

  /**
   * Get password strength label
   */
  static getStrengthLabel(score: number): string {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[score] || 'Unknown';
  }

  /**
   * Get password strength color (for UI)
   */
  static getStrengthColor(score: number): string {
    const colors = [
      'red', // 0 - Very weak
      'orange', // 1 - Weak
      'yellow', // 2 - Fair
      'blue', // 3 - Good
      'green', // 4 - Strong
    ];
    return colors[score] || 'gray';
  }
}
