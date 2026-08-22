export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export interface WhatsAppPayload {
  to: string; // E.164 phone
  message: string;
}

export class MessagingService {
  async sendEmail(payload: EmailPayload): Promise<boolean> {
    console.log(`[Email Service] Mock sending email to ${payload.to}. Subject: "${payload.subject}"`);
    return true;
  }

  async sendWhatsApp(payload: WhatsAppPayload): Promise<boolean> {
    console.log(`[WhatsApp Service] Mock sending WhatsApp to ${payload.to}. Content: "${payload.message}"`);
    return true;
  }
}

export const messaging = new MessagingService();
