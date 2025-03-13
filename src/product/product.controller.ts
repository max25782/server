import { Controller, Query, UsePipes,Get, ValidationPipe, Param, HttpCode, Post, Put, Body, Delete } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDto } from './dto/product.dto';
import { Auth } from 'src/auth/decorators/auth decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }
  
  @UsePipes(ValidationPipe)
  @Get()
  async getAll(@Query('searchTerm') searchTerm?: string) {
    return this.productService.getAll(searchTerm);
  }

  @Get('by-slug/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productService.bySlug(slug);
  }

  @Get('by-category/:categorySlug')
  async getProductByCategory(@Param('categorySlug') categorySlug: string) {
    return this.productService.byCategory(categorySlug);
  }

  @UsePipes(ValidationPipe)
  @HttpCode(200)
  @Post()
  @Auth()
  async create() {
    return this.productService.create();
  }

  @UsePipes(ValidationPipe)
  @HttpCode(200)
  @Put(':id')
  @Auth()
  async update(@Param('id') id: string, @Body() dto: ProductDto) {
    return this.productService.update(id, dto);
  }

  @HttpCode(200)
  @Delete(':id')
  @Auth()
  async delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }
}
