import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe(
      // tole, da ne morem prejet vec kot jst pricakujem ...
      { whitelist: true },
    ),
  );
  await app.listen(3333);
}
bootstrap();
