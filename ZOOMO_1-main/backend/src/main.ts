import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Seed dish/restaurant photos — served here so every portal (admin,
  // merchant, driver, customer) resolves the same absolute URL regardless
  // of which frontend origin is rendering them. See
  // scripts/migrate-seed-images-to-local-static.mjs.
  app.useStaticAssets(join(__dirname, '..', '..', 'public', 'static'), { prefix: '/static' });

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, mobile)
      if (!origin) return callback(null, true);

      // Allow all localhost ports
      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }

      // Allow ALL vercel.app subdomains permanently
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
