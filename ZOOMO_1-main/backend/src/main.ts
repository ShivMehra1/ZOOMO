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
      if (!origin) return callback(null, true);
      try {
        const host = new URL(origin).hostname;
        const local =
          host === "localhost" ||
          host === "127.0.0.1" ||
          host.startsWith("192.168.") ||
          host.startsWith("10.") ||
          /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
        const prod = host === "zoomoeats.com" || host.endsWith(".zoomoeats.com");
        const vercel = host.endsWith(".vercel.app");
        // Never pass an Error into this callback — Express turns that into a 500
        // and the admin UI looks like "nothing loaded".
        return callback(null, local || prod || vercel);
      } catch {
        return callback(null, false);
      }
    },
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
