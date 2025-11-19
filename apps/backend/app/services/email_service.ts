import type { ResendModule, SendGridModule } from '#types/email';

import env from '#start/env';

/**
 * Email Service
 *
 * Sends emails via configured provider (Resend, SendGrid, SMTP, etc.)
 * For now, we'll use a simple implementation that can be extended with actual email providers
 */
export class EmailService {
  private static initialized = false;
  private static provider: 'resend' | 'sendgrid' | 'smtp' | null = null;

  /**
   * Get logger instance (lazy import to avoid initialization issues)
   */
  private static getLogger() {
    // Use dynamic import to avoid issues during module initialization
    return import('@adonisjs/core/services/logger').then((m) => m.default);
  }

  /**
   * Initialize email service based on environment configuration
   * Note: This is called lazily when needed, not at module load time
   */
  static async initialize() {
    if (this.initialized) return;

    const logger = await this.getLogger();

    const providerName = env.get('EMAIL_PROVIDER', 'smtp') as 'resend' | 'sendgrid' | 'smtp';

    switch (providerName) {
      case 'resend':
        if (env.get('RESEND_API_KEY')) {
          this.provider = 'resend';
          logger.info('Email service initialized with Resend');
        } else {
          logger.warn('RESEND_API_KEY not set, email service will not work');
        }
        break;
      case 'sendgrid':
        if (env.get('SENDGRID_API_KEY')) {
          this.provider = 'sendgrid';
          logger.info('Email service initialized with SendGrid');
        } else {
          logger.warn('SENDGRID_API_KEY not set, email service will not work');
        }
        break;
      case 'smtp':
        // SMTP configuration would go here
        logger.info('Email service initialized with SMTP (not yet implemented)');
        break;
      default:
        logger.warn(`Unknown email provider: ${providerName}`);
    }

    this.initialized = true;
  }

  /**
   * Send OTP email
   * Better Auth Email OTP plugin will call this
   */
  static async sendOTP(options: {
    to: string;
    otp: string;
    type: 'email-verification' | 'sign-in' | 'password-reset';
  }): Promise<void> {
    // Ensure service is initialized (lazy initialization)
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.provider) {
      // In development, log OTP to console instead of failing
      if (env.get('NODE_ENV') === 'development') {
        const logger = await this.getLogger();
        logger.info(`[DEV] OTP for ${options.to}: ${options.otp} (type: ${options.type})`);
        return;
      }
      throw new Error('Email service not configured. Please set EMAIL_PROVIDER and API keys.');
    }

    const subject = this.getSubject(options.type);
    const html = this.getOTPTemplate(options.otp, options.type);

    try {
      switch (this.provider) {
        case 'resend':
          await this.sendViaResend(options.to, subject, html);
          break;
        case 'sendgrid':
          await this.sendViaSendGrid(options.to, subject, html);
          break;
        case 'smtp':
          await this.sendViaSMTP(options.to, subject, html);
          break;
      }
      const logger = await this.getLogger();
      logger.info(`OTP email sent to ${options.to} (type: ${options.type})`);
    } catch (error: unknown) {
      const logger = await this.getLogger();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to send OTP email: ${errorMessage}`);
      throw new Error('Failed to send verification code. Please try again.');
    }
  }

  /**
   * Send email via Resend
   */
  private static async sendViaResend(to: string, subject: string, html: string): Promise<void> {
    // Optional dependency - may not be installed
    // @ts-expect-error - resend is an optional dependency, may not be installed
    const resendModule = (await import('resend').catch(() => null)) as ResendModule | null;
    if (!resendModule || !resendModule.Resend) {
      throw new Error('Resend package not installed. Run: npm install resend');
    }

    const apiKey = env.get('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    const resend = new resendModule.Resend(apiKey);
    await resend.emails.send({
      from: env.get('EMAIL_FROM', 'noreply@example.com'),
      to,
      subject,
      html,
    });
  }

  /**
   * Send email via SendGrid
   */
  private static async sendViaSendGrid(to: string, subject: string, html: string): Promise<void> {
    // @ts-expect-error - @sendgrid/mail is an optional dependency, may not be installed
    const sgMail = (await import('@sendgrid/mail').catch(() => null)) as SendGridModule | null;
    if (!sgMail || !sgMail.default) {
      throw new Error('SendGrid package not installed. Run: npm install @sendgrid/mail');
    }

    sgMail.default.setApiKey(env.get('SENDGRID_API_KEY')!);
    await sgMail.default.send({
      from: env.get('EMAIL_FROM', 'noreply@example.com'),
      to,
      subject,
      html,
    });
  }

  /**
   * Send email via SMTP (placeholder for future implementation)
   */
  private static async sendViaSMTP(_to: string, _subject: string, _html: string): Promise<void> {
    // TODO: Implement SMTP sending using nodemailer or similar
    throw new Error('SMTP email sending not yet implemented');
  }

  /**
   * Get email subject based on OTP type
   */
  private static getSubject(type: string): string {
    switch (type) {
      case 'email-verification':
        return 'Verify your email address';
      case 'sign-in':
        return 'Your sign-in code';
      case 'password-reset':
        return 'Reset your password';
      default:
        return 'Your verification code';
    }
  }

  /**
   * Get OTP email template
   */
  private static getOTPTemplate(otp: string, type: string): string {
    const messages: Record<string, string> = {
      'email-verification': 'Use this code to verify your email address:',
      'sign-in': 'Use this code to sign in:',
      'password-reset': 'Use this code to reset your password:',
    };

    const message = messages[type] || 'Your verification code:';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              text-align: center;
              padding: 20px;
              background: #f5f5f5;
              border-radius: 8px;
              margin: 20px 0;
              font-family: 'Courier New', monospace;
              color: #1a1a1a;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e5e5;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 style="margin-top: 0;">${message}</h1>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in 10 minutes.</p>
            <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Don't initialize on module load - initialize lazily when first needed
// This avoids issues with logger service not being available during module initialization
