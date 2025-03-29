import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { returnCategoryObject } from './return-category.object';
import { Category, Prisma } from '@prisma/client';
import { CategoryDto } from './dto/category.dto';
import { generateSlug } from 'src/utils/generate-slug';
import { faker } from '@faker-js/faker';

@Injectable()
export class CategoryService {
    constructor(private prisma: PrismaService) { }
    
    async getAll() {
        return this.prisma.category.findMany({
            select: returnCategoryObject
        });
    }

    async byId(id: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            select: returnCategoryObject
        })
        if (!category) throw new NotFoundException('Category not found');

        return category;
    }

    async bySlug(slug: string) {
        const category = await this.prisma.category.findUnique({
            where: { slug },
            select: returnCategoryObject
        })
        if (!category) throw new NotFoundException('Category not found');
        
        return category;
    }
    async create() {
        const name = faker.commerce.department();
        return this.prisma.category.create({
            data: {
                name,
                slug: generateSlug(name + '-' + Date.now()),
                image: faker.image.urlLoremFlickr({ category: 'food' }),
            },
            select: returnCategoryObject
        })
    }
    async update(id: string, dto: CategoryDto)  {
        const category = await this.prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        // Check if category with this name already exists and it's not the same category
        const existingCategory = await this.prisma.category.findFirst({
            where: {
                name: dto.name,
                id: { not: id }
            }
        });

        if (existingCategory) {
            throw new ConflictException('Category with this name already exists');
        }

        try {
            return await this.prisma.category.update({
                where: { id },
                data: {
                    name: dto.name,
                    slug: generateSlug(dto.name + '-' + Date.now()),
                    image: dto.image,
                },
                select: returnCategoryObject
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Category with this name already exists');
            }
            throw error;
        }
    }

    async delete(id: string) {
        return this.prisma.category.delete({
            where: { id }
        })
    }

}
