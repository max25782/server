import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Res, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { I18n, I18nContext } from 'nestjs-i18n';
import { PdfService } from 'src/order/pdf.service';
import { Response } from 'express';
import { OrderService } from 'src/order/order.service';

class CreateAdminDto {
  email: string;
  password: string;
  name: string;
}

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly pdfService: PdfService,
    private readonly orderService: OrderService
  ) {}

  @Get('users')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Auth()
  getAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Get('orders')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Auth()
  getAllOrders() {
    return this.adminService.findAllOrders();
  }

  @Get('orders/:id/pdf')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Auth()
  async downloadOrderPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.pdfService.generateOrderPdf(id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=order-${id}.pdf`,
      'Content-Length': buffer.length,
    });
    
    res.end(buffer);
  }

  @Get('products-stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Auth()
  getProductsStats() {
    return this.adminService.getProductsStats();
  }

  @Post('create')
  createAdmin(
    @Body() createAdminDto: CreateAdminDto,
    @Headers('accept-language') lang: string = 'en',
    @I18n() i18n: I18nContext
  ) {
    const { email, password, name } = createAdminDto;
    return this.adminService.createAdmin(email, password, name, lang || i18n.lang);
  }

  @Put('make-admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Auth()
  makeUserAdmin(
    @Param('id') userId: string,
    @Headers('accept-language') lang: string = 'en',
    @I18n() i18n: I18nContext
  ) {
    return this.adminService.makeUserAdmin(userId, lang || i18n.lang);
  }

  @Delete('orders/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Auth()
  deleteOrder(@Param('id') id: string) {
    return this.orderService.deleteOrder(id);
  }
}
