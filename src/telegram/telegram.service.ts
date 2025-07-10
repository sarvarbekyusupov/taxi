import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class TelegramService {
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN; // store securely
  private readonly channelId = process.env.TELEGRAM_CHANNEL_ID; // like -1001234567890

  async sendOtpToChannel(otp: string, phone: string, role: string) {
    const message = `📱 OTP for ${phone}: ${otp} role: ${role}`;
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    try {
      await axios.get(url, {
        params: {
          chat_id: this.channelId,
          text: message,
        },
      });
    } catch (error) {
      console.error(
        "❌ Failed to send OTP via Telegram:",
        error?.response?.data || error.message
      );
    }
  }
}
