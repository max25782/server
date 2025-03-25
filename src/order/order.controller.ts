import { Body, Controller, Get, HttpCode, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { Auth } from 'src/auth/decorators/auth decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { use } from 'passport';
import { ne } from '@faker-js/faker/.';
import { OrderDto } from './dto/order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }
  
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

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post()
  @Auth()
  placeOrder(@Body() dto: OrderDto, @CurrentUser('id') userId: string) {
    return this.orderService.placeOrder(dto, userId);
  }
}
