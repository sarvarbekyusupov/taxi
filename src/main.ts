import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { winstonLogger } from "./common/loggers/winston.logger";
import { AllExceptionsFilter } from "./common/errors/error.handling";
import { createServer } from "http";
import { Server } from "socket.io";
import { setSocketInstance } from "./socket/socket.provider";

async function start() {
  try {
    const PORT = process.env.PORT || 3030;

    // Create the NestJS application with Winston logger
    const app = await NestFactory.create(AppModule, {
      logger: winstonLogger,
    });

    // Create a custom HTTP server to attach Socket.IO
    const httpServer = createServer(app.getHttpAdapter().getInstance());

    // Initialize Socket.IO with CORS settings
    const io = new Server(httpServer, {
      cors: {
        origin: ["http://localhost:3030", "http://localhost:3031"],
        credentials: true,
      },
    });

    // Set the Socket.IO server for global DI
    setSocketInstance(io);

    // app.select(AppModule).get(SOCKET_IO_SERVER as any); 

    // Middlewares and global settings
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new AllExceptionsFilter());

    // Enable CORS with custom logic
    app.enableCors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          "http://localhost:3030",
          "http://localhost:3031",
        ];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new BadRequestException("Not allowed by CORS"));
        }
      },
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true,
    });

    // Swagger API docs setup
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

    // Initialize NestJS modules before starting HTTP + WebSocket server
    await app.init();
    await httpServer.listen(PORT);

    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`📚 Swagger docs available at http://localhost:${PORT}/api`);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
}

start();
