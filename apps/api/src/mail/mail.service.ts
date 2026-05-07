import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend?: Resend;
  private readonly fromEmail?: string;
  private readonly appUrl: string;
  private readonly appName: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    this.fromEmail = config.get<string>('RESEND_FROM_EMAIL');
    this.appUrl = config.get<string>('APP_URL', 'http://localhost:3000');
    this.appName = config.get<string>('APP_NAME', 'Sploy');

    if (apiKey && this.fromEmail) {
      this.resend = new Resend(apiKey);
    }
  }

  isConfigured(): boolean {
    return Boolean(this.resend && this.fromEmail);
  }

  getAppName(): string {
    return this.appName;
  }

  /** Turns an app path or relative URL into an absolute URL using `APP_URL`. */
  toAbsoluteUrl(pathOrUrl: string): string {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
    }
    return `${this.appUrl.replace(/\/$/, '')}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
  }

  async sendHtml(params: {
    to: string | string[];
    subject: string;
    html: string;
  }): Promise<void> {
    if (!this.resend || !this.fromEmail) return;

    const to = Array.isArray(params.to) ? params.to : [params.to];

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: params.subject,
        html: params.html,
      });
    } catch (error) {
      this.logger.error(`Failed to send email: ${error}`);
    }
  }
}
