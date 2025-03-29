import { Body, Controller, Delete, Get, HttpCode, Param, Post, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { OrderDto } from './dto/order.dto';
import { PdfService } from './pdf.service';
import { Response } from 'express';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly pdfService: PdfService
  ) { }
  
  @Get()
  @Auth()
  getAll() { 
    return this.orderService.getAll();
  }

  @Get('by-user')
  @Auth()
  getByUserId(@CurrentUser('id') userId: string) {
    return this.orderService.getByUser(userId);
  }

  @Get(':id/pdf')
  @Auth()
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.pdfService.generateOrderPdf(id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=order-${id}.pdf`,
      'Content-Length': buffer.length,
    });
    
    res.end(buffer);
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post()
  @Auth()
  placeOrder(@Body() dto: OrderDto, @CurrentUser('id') userId: string) {
    return this.orderService.placeOrder(dto, userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Auth()
  deleteOrder(@Param('id') id: string) {
    return this.orderService.deleteOrder(id);
  }
}
