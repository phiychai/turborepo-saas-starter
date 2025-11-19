/**
 * Email Service Type Definitions
 * Types for optional email provider dependencies (Resend, SendGrid)
 */

/**
 * Resend Module Type
 * Partial type definition for the resend package
 */
export interface ResendModule {
  Resend: new (apiKey: string) => ResendClient;
}

export interface ResendClient {
  emails: {
    send: (options: {
      from: string;
      to: string;
      subject: string;
      html: string;
    }) => Promise<unknown>;
  };
}

/**
 * SendGrid Module Type
 * Partial type definition for the @sendgrid/mail package
 */
export interface SendGridModule {
  default: {
    setApiKey: (apiKey: string) => void;
    send: (options: {
      from: string;
      to: string;
      subject: string;
      html: string;
    }) => Promise<unknown>;
  };
}
