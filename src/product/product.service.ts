import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ProductDto } from './dto/product.dto';
import { generateSlug } from 'src/utils/generate-slug';
import { returnProductObject } from './return-product.object';
import { CategoryService } from 'src/category/category.service';
import { Prisma, Category } from '@prisma/client';

@Injectable()
export class ProductService {
    constructor(
        private prisma: PrismaService,
        private categoryService: CategoryService     
    ) { }
        
    async getAll(searchTerm?: string) {
        if (searchTerm) return this.search(searchTerm);  

            return this.prisma.product.findMany({
                select: returnProductObject,
                orderBy: {
                    createdAt: 'desc'
                }
            });
    }
    
    async search(searchTerm: string) {
        return this.prisma.product.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    {
                        description: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                ]
            },
            select: returnProductObject
        })
    }
    
    async bySlug(slug: string) {
        const product = await this.prisma.product.findUnique({
            where: { slug },
            select: returnProductObject
        })
        if (!product) throw new NotFoundException('Product not found');

        return product;
    }

    async byCategory(categorySlug: string) {
        const products = await this.prisma.product.findMany({
            where: { 
                category: {  
                    slug: categorySlug
                }
            },
            select: returnProductObject
        })
        if (!products) throw new NotFoundException('Products not found');

        return products;
    }
    
    async create(dto: ProductDto) {
        try {
            const { name, description, price, categoryId, image, weight } = dto;
            
            let category: {id: string};
            try {
                // Try to find category by ID first
                category = await this.categoryService.byId(categoryId);
            } catch (error) {
                try {
                    // If not found by ID, try by slug
                    category = await this.categoryService.bySlug(categoryId);
                } catch (innerError) {
                    throw new NotFoundException(`Category not found with ID or slug: ${categoryId}`);
                }
            }
            
            return await this.prisma.product.create({
                data: {
                    name,
                    description,
                    price,
                    weight,
                    slug: generateSlug(name),
                    image,
                    category: {
                        connect: {
                            id: category.id
                        }
                    }
                },
                select: returnProductObject
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Product with this name already exists');
            }
            throw error;
        }
    }
    
    async update(id: string, dto: ProductDto) {
        const { name, description, price, categoryId, image, weight } = dto;
        
        console.log('Updating product with ID:', id);
        console.log('Update DTO:', dto);

        // Проверка продукта
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { category: true }
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }
        
        console.log('Found existing product:', product);

        // Если категория не указана в DTO, используем текущую категорию продукта
        if (!categoryId) {
            console.log('No categoryId provided, using current category:', product.category);
            try {
                const updatedProduct = await this.prisma.product.update({
                    where: { id },
                    data: {
                        name,
                        description,
                        price,
                        weight,
                        image,
                        slug: generateSlug(name),
                    },
                    select: returnProductObject
                });
                return updatedProduct;
            } catch (error) {
                console.error('Error updating product without category change:', error);
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2002') {
                        throw new ConflictException('Product with this name already exists');
                    }
                }
                throw error;
            }
        }

        // Проверка существования категории
        console.log('Checking category with ID/slug:', categoryId);
        let category: {id: string};
        
        // Сначала проверим существующие категории
        const allCategories = await this.prisma.category.findMany({
            select: { id: true, name: true, slug: true }
        });
        console.log('Available categories:', allCategories);
        
        // Попытка найти категорию по ID
        try {
            // Проверка прямо в базе
            const dbCategory = await this.prisma.category.findUnique({
                where: { id: categoryId }
            });
            
            if (dbCategory) {
                console.log('Category found directly in DB:', dbCategory);
                category = { id: dbCategory.id };
            } else {
                // Если не найдено по ID, пробуем через slug
                const slugCategory = await this.prisma.category.findUnique({
                    where: { slug: categoryId }
                });
                
                if (slugCategory) {
                    console.log('Category found by slug:', slugCategory);
                    category = { id: slugCategory.id };
                } else {
                    // Если категория не найдена
                    console.error('Category not found:', categoryId);
                    throw new NotFoundException(`Category not found with ID or slug: ${categoryId}`);
                }
            }
        } catch (error) {
            console.error('Error finding category:', error);
            throw new NotFoundException(`Category not found with ID or slug: ${categoryId}`);
        }

        // Обновление продукта
        try {
            console.log('Updating product with category ID:', category.id);
            const updatedProduct = await this.prisma.product.update({
                where: { id },
                data: {
                    name,
                    description,
                    price,
                    weight,
                    image,
                    slug: generateSlug(name),
                    category: {
                        connect: {
                            id: category.id
                        }
                    }
                },
                select: returnProductObject
            });
            console.log('Product updated successfully:', updatedProduct);
            return updatedProduct;
        } catch (error) {
            console.error('Error updating product with category change:', error);
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('Product with this name already exists');
                }
                console.error('Prisma error code:', error.code);
            }
            throw error;
        }
    }
    
    async delete(id: string) {
        try {
            // Сначала проверяем, существует ли продукт
            const product = await this.prisma.product.findUnique({
                where: { id }
            });
            
            if (!product) {
                throw new NotFoundException('Product not found');
            }
            
            return this.prisma.product.delete({
                where: { id },
                select: returnProductObject
            });
        } catch (error) {
            console.error('Error deleting product:', error);
            if (error instanceof NotFoundException) {
                throw error;
            }
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                console.error('Prisma error code:', error.code);
                // Можно добавить обработку специфических ошибок Prisma
                if (error.code === 'P2025') {
                    throw new NotFoundException('Product not found');
                }
            }
            throw error;
        }
    }

}
