import { IMailCode, IMailType } from '@constants/mail.constant';

export interface IMailService {
  /**
   * Sends an email with the specified type, subject, recipient, and message.
   * @param type - The type of the email, defined in MAIL_CODE.
   * @param subject - The subject of the email.
   * @param to - The recipient's email address.
   * @param message - The content of the email message.
   * @returns A promise that resolves to a boolean indicating success or failure.
   */
  sendHTMLEmail(
    type: IMailCode,
    message: string,
    to: string,
    subject: string,
    cc?: string[],
  ): Promise<void>;

  /**
   * Sends a simple email with the specified subject, recipient, and message.
   * @param message - The content of the email message.
   * @param to - The recipient's email address.
   * @param subject - The subject of the email.
   * @returns A promise that resolves to a boolean indicating success or failure.
   */
  sendSimpleEmail(message: string, to: string, subject: string): Promise<void>;
}

export interface IMailMessage {
  email: string;
  token: string;
  type: IMailType;
  language?: string;
}

export interface SendOtpEmailPayload {
  email: string;
  otp: string;
  metadata: OtpEmailMetadata;
}

export interface OtpEmailMetadata {
  resendCount: number;
  resendLimit: number;
  resendAt: Date;
  expireAt?: Date;
  updatedAt?: Date;
}
