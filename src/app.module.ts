import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
// import { RiderModule } from './rider/';
import { DriverModule } from "./driver/driver.module";
import { AdminModule } from "./admin/admin.module";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CarModule } from "./car/car.module";
// import { ClientPaymentCardModule } from './client_payment_card/client_payment_card.module';
import { ClientPaymentCardModule } from "./client-payment-card/client-payment-card.module";
import { ClientModule } from "./client/client.module";
import { DriverPaymentCardModule } from "./driver-payment-card/driver-payment-card.module";
import { RidesModule } from "./rides/rides.module";
import { PaymentsModule } from "./payments/payments.module";
import { TariffModule } from "./tariff/tariff.module";
import { PromoCodeModule } from "./promo-code/promo-code.module";
import { PromoCodeUsageModule } from "./promo-code-usage/promo-code-usage.module";
import { ChatMessagesModule } from "./chat-messages/chat-messages.module";
import { RatingsModule } from "./ratings/ratings.module";
import { ClientSessionModule } from "./client-session/client-session.module";
import { DriverSessionModule } from "./driver-session/driver-session.module";
import { OtpModule } from "./otp/otp.module";
// import { DriverModule } from './earnings/driver/driver.module';
import { DriverEarningsModule } from "./driver-earnings/driver-earnings.module";
import { DriverPayoutsModule } from "./driver-payouts/driver-payouts.module";
import { DailyStatsModule } from "./daily-stats/daily-stats.module";
import { ServiceAreasModule } from "./service-areas/service-areas.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SupportTicketsModule } from "./support-tickets/support-tickets.module";
import { Admin } from "./admin/entities/admin.entity";
import { MailModule } from "./mail/mail.module";
import { Tariff } from "./tariff/entities/tariff.entity";
import { SupportTicket } from "./support-tickets/entities/support-ticket.entity";
import { ServiceArea } from "./service-areas/entities/service-area.entity";
import { Ride } from "./rides/entities/ride.entity";
import { Rating } from "./ratings/entities/rating.entity";
import { PromoCodeUsage } from "./promo-code-usage/entities/promo-code-usage.entity";
import { PromoCode } from "./promo-code/entities/promo-code.entity";
import { Payment } from "./payments/entities/payment.entity";
import { Otp } from "./otp/entities/otp.entity";
import { Notification } from "./notifications/entities/notification.entity";
import { DriverSession } from "./driver-session/entities/driver-session.entity";
import { DriverPayout } from "./driver-payouts/entities/driver-payout.entity";
import { DriverPaymentCard } from "./driver-payment-card/entities/driver-payment-card.entity";
import { DriverEarning } from "./driver-earnings/entities/driver-earning.entity";
import { Driver } from "./driver/entities/driver.entity";
import { DailyStats } from "./daily-stats/entities/daily-stat.entity";
import { ClientSession } from "./client-session/entities/client-session.entity";
import { ClientPaymentCard } from "./client-payment-card/entities/client-payment-card.entity";
import { Client } from "./client/entities/client.entity";
import { ChatMessage } from "./chat-messages/entities/chat-message.entity";
import { Car } from "./car/entities/car.entity";
import { LocationModule } from './location/location.module';
import { SocketModule } from "./socket/socket.module";
import { BullModule } from "@nestjs/bull";
import { ScheduleModule } from "@nestjs/schedule";
import { TelegramService } from "./telegram/telegram.service";
import { TelegramModule } from "./telegram/telegram.module";
// import { PaymeModule } from './payme/payme.module';
import { FirebaseModule } from './firebase/firebase.module';
import { CarTypeModule } from './car-type/car-type.module';
import { CarType } from "./car-type/entities/car-type.entity";
import { RideChat } from "./ride-chat/entities/ride-chat.entity";
import { RideChatModule } from "./ride-chat/ride-chat.module";

@Module({
  imports: [
    ConfigModule.forRoot({ cache: true }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: "localhost",
        port: 6379,
      },
    }),
    BullModule.registerQueue({ name: "notifications" }),
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
    SocketModule,
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT),
      username: process.env.PG_USERNAME,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DB,
      entities: [
        Admin,
        Tariff,
        SupportTicket,
        ServiceArea,
        Ride,
        Rating,
        PromoCodeUsage,
        PromoCode,
        Payment,
        Otp,
        Notification,
        DriverSession,
        DriverPayout,
        DriverPaymentCard,
        DriverEarning,
        Driver,
        DailyStats,
        ClientSession,
        ClientPaymentCard,
        Client,
        ChatMessage,
        Car,
        CarType,
        RideChat
      ],
      synchronize: true,
    }),
    AuthModule,
    DriverModule,
    AdminModule,
    CarModule,
    ClientPaymentCardModule,
    ClientModule,
    DriverPaymentCardModule,
    RidesModule,
    PaymentsModule,
    TariffModule,
    PromoCodeModule,
    PromoCodeUsageModule,
    ChatMessagesModule,
    RatingsModule,
    ClientSessionModule,
    DriverSessionModule,
    OtpModule,
    DriverEarningsModule,
    DriverPayoutsModule,
    DailyStatsModule,
    ServiceAreasModule,
    NotificationsModule,
    SupportTicketsModule,
    MailModule,
    LocationModule,
    TelegramModule,
    FirebaseModule,
    CarTypeModule,
    RideChatModule,
    // PaymeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
