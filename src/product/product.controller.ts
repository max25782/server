import { Controller, Query, UsePipes,Get, ValidationPipe, Param, HttpCode, Post, Put, Body, Delete, Patch, Redirect } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDto } from './dto/product.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CategoryService } from 'src/category/category.service';
import { UserService } from 'src/user/user.service';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly userService: UserService
  ) { }
  
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
  async create(@Body() dto: ProductDto) {
    return this.productService.create(dto);
  }

  @UsePipes(ValidationPipe)
  @HttpCode(200)
  @Put(':id')
  @Auth()
  async update(@Param('id') id: string, @Body() dto: ProductDto) {
    try {
      const product = await this.productService.update(id, dto);
      return { success: true, product };
    } catch (error) {
      console.error('Error in ProductController.update:', error);
      return { 
        success: false, 
        message: error.message,
        statusCode: error.status || 500
      };
    }
  }

  @HttpCode(200)
  @Delete(':id')
  @Auth()
  async delete(@Param('id') id: string) {
    try {
      const product = await this.productService.delete(id);
      return { success: true, product };
    } catch (error) {
      console.error('Error in ProductController.delete:', error);
      return { 
        success: false, 
        message: error.message,
        statusCode: error.status || 500
      };
    }
  }

  @Get('check-category/:id')
  async checkCategory(@Param('id') id: string) {
    try {
      const category = await this.categoryService.byId(id);
      return { exists: true, category };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }

  @HttpCode(200)
  @Auth()
  @Patch(':id/favorite')
  async toggleProductFavorite(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string
  ) {
    return this.userService.toggleFavorite(userId, productId);
  }
  
  @HttpCode(200)
  @Auth()
  @Post(':id/favorite')
  async toggleProductFavoritePost(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string
  ) {
    return this.userService.toggleFavorite(userId, productId);
  }
}
