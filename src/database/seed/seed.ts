import { NestFactory } from '@nestjs/core';
import { UserSeedService } from './user-seed.service';
import { AppModule } from 'src/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const userSeedService = app.get(UserSeedService);
  await userSeedService.run();
  await app.close();
}

bootstrap().catch((err) => console.error('Seed failed:', err));