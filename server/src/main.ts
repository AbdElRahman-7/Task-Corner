import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CLIENT_URL?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.getHttpAdapter().get('/', (req, res) => {
    res.send('API is running...');
  });

  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5000;

  await app.listen(port);
  console.log(`Nest application running on port ${port}`);
}

bootstrap();
