import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UsePipes, ValidationPipe } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryDto } from './dto/category.dto';
import { Auth } from 'src/auth/decorators/auth decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }
  
  @Get()
  async getAll() {
    return this.categoryService.getAll();
  }

@Get('by-id/:id')
  async getById(@Param('id') id: string) {
    return this.categoryService.byId(id);
  }

  @Get('by-slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.categoryService.bySlug(slug);
  }

  @HttpCode(200)
  @Post()
  @Auth()
  async create() {
    return this.categoryService.create();
  }
  
  @HttpCode(200)
  @UsePipes(new ValidationPipe())
  @Put(':id')
  @Auth()
  async update(@Param('id') id: string, @Body()dto: CategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @HttpCode(200)
  @Delete(':id')
  @Auth()  
  async delete(@Param('id') id: string) {
    return  this.categoryService.delete(id);
  }
}
