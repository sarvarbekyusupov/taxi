import { Module } from "@nestjs/common";
import { TelegramService } from "./telegram.service";

@Module({
  providers: [TelegramService], // ✅ ADD HERE
  exports: [TelegramService], // (optional, if used in other modules)
})
export class TelegramModule {}
