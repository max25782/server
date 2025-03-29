import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ServeStaticModule } from '@nestjs/serve-static'
import { AuthModule } from './auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { UserModule } from './user/user.module';
import { path } from 'app-root-path'
import { OrderModule } from './order/order.module';
import { AdminModule } from './admin/admin.module'
import { I18nConfigModule } from './i18n/i18n.module'

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: `${path}/uploads`,
      serveRoot: '/uploads'
    }),
    ConfigModule.forRoot(),
    I18nConfigModule,
    AuthModule,
    CategoryModule,
    ProductModule,
    UserModule,
    OrderModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
