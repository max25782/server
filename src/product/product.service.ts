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

        const product = await this.prisma.product.findUnique({
            where: { id }
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Find the category - try as both ID and slug
        let category: {id: string};
        try {
            // First try as ID
            category = await this.categoryService.byId(categoryId);
        } catch (error) {
            try {
                // If not found by ID, try as slug
                category = await this.categoryService.bySlug(categoryId);
            } catch (innerError) {
                console.error('Category not found by ID or slug:', categoryId, innerError);
                throw new NotFoundException(`Category not found with ID or slug: ${categoryId}`);
            }
        }

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
                    category: {
                        connect: {
                            id: category.id
                        }
                    }
                },
                select: returnProductObject
            });
            return updatedProduct;
        } catch (error) {
            console.error('Error updating product:', error);
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
        return this.prisma.product.delete({
            where: { id }
        })
    }

}
