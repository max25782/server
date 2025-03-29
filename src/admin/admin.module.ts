import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma.service';
import { PdfService } from 'src/order/pdf.service';
import { I18nConfigModule } from 'src/i18n/i18n.module';
import { OrderService } from 'src/order/order.service';

@Module({
  imports: [I18nConfigModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService, PdfService, OrderService],
})
export class AdminModule {}
