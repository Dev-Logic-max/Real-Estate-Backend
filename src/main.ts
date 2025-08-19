import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
// import chalk from 'chalk'; // Install with: npm install chalk
const chalk = require('chalk');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Serve static files from the uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable CORS with specific origin (e.g., frontend)
  app.enableCors({
    origin: process.env.FRONTEND_DOMAIN || 'http://localhost:3000', // Allow frontend origin
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    credentials: true, // Set true if using JWT tokens/cookies for auth (from frontend)
  });

  // Set global prefix from environment variable
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api');

  const config = new DocumentBuilder()
    .setTitle('Real Estate API')
    .setDescription('API for real estate platform')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, // Define Bearer token
      'access-token', // This name should match the security key below
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${process.env.API_PREFIX?? 'api'}`, app, document, {
    swaggerOptions: {
      security: [{ 'access-token': [] }], // Apply global security (optional)
    },
  });

  // const port = configService.get<number>('PORT', 3010);
  const port = process.env.PORT ?? 3010;
  await app.listen(port);

  console.log(chalk.blue.bold('✨ ================================ ✨'));
  console.log(chalk.green.bold('  Real Estate Backend Started!  '));
  console.log(chalk.blue.bold('🎉 ================================ 🎉'));
  console.log(chalk.yellow(`  Running on port: ${port}`));
  console.log(chalk.blue.bold('🎊 ================================ 🎊'));
}
bootstrap();
