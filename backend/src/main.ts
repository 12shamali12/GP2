import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import express, { json, urlencoded } from "express";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS:
  //   - In production (NODE_ENV=production) we REQUIRE an explicit CORS_ORIGIN
  //     allowlist. Without it, every browser request is rejected. This stops
  //     a misconfigured deploy from accidentally serving any origin.
  //   - In development (or anywhere NODE_ENV !== production) we allow all
  //     origins so localhost:3000 → localhost:3100 just works.
  const isProd = process.env.NODE_ENV === "production";
  const allowlist = process.env.CORS_ORIGIN?.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (isProd && (!allowlist || allowlist.length === 0)) {
    throw new Error(
      "CORS_ORIGIN is required in production. Set it to the public URL of " +
        "the frontend (e.g. https://dentyhub.vercel.app) and redeploy.",
    );
  }
  app.enableCors({
    origin: allowlist && allowlist.length > 0 ? allowlist : "*",
    credentials: false,
  });
  app.use(json({ limit: "2mb" }));
  app.use(urlencoded({ limit: "2mb", extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const uploadDir = join(process.cwd(), "uploads", "chat");
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  app.use("/uploads", express.static(join(process.cwd(), "uploads")));

  const swaggerConfig = new DocumentBuilder()
    .setTitle("DentyHub API")
    .setDescription("Dental clinic management platform REST API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
