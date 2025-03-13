import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log']
  })

  app.setGlobalPrefix('api')
  app.enableCors()
  await app.listen(process.env.PORT ?? 5000,'0.0.0.0')
}
bootstrap()
