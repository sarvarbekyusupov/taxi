import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { winstonLogger } from "./common/loggers/winston.logger";
import { AllExceptionsFilter } from "./common/errors/error.handling";
import { RedisIoAdapter } from "./socket/socket.adapter";

async function start() {
  try {
    const PORT = process.env.PORT || 3030;

    const app = await NestFactory.create(AppModule, {
      logger: winstonLogger,
    });

    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);

    app.use(cookieParser());
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new AllExceptionsFilter());

    // app.enableCors({
    //   origin: (origin, callback) => {
    //     const allowedOrigins = [
    //       "http://localhost:3030",
    //       "http://localhost:3031",
    //     ];
    //     if (!origin || allowedOrigins.includes(origin)) {
    //       callback(null, true);
    //     } else {
    //       callback(new BadRequestException("Not allowed by CORS"));
    //     }
    //   },
    //   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    //   credentials: true,
    // });

    const swaggerConfig = new DocumentBuilder()
      .setTitle("Taxi API")
      .setDescription("Taxi Management System API Documentation")
      .setVersion("1.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Enter JWT token",
          in: "header",
        },
        "JWT-auth"
      )
      .addTag("Taxi API")
      .addSecurityRequirements("JWT-auth")
      .build();

    const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api", app, swaggerDoc, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: "Taxi API Documentation",
    });

    await app.listen(PORT);

    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`📚 Swagger docs available at http://localhost:${PORT}/api`);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
}

start();
