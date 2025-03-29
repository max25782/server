import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from 'src/prisma.service';
import { PdfService } from './pdf.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, PrismaService, PdfService],
})
export class OrderModule {}
