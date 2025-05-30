import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
// import { Patient } from "../patient/models/patient.model";
import { Admin } from "../admin/entities/admin.entity";

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(user: Admin) {
    const url = `${process.env.API_HOST}/api/admin/activate/${user.activation_link}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: "Welcome to Taxi app!",
      template: "confirmation",
      context: {
        name: user.first_name,
        url,
      },
    });
  }
}
