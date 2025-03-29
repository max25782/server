import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log']
  })

  app.setGlobalPrefix('api', {
    exclude: ['/'],
  })
  app.enableCors()
  await app.listen(process.env.PORT ?? 5000)
}
bootstrap()
