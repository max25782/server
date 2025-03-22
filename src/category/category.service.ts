import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { returnCategoryObject } from './return-category.object';
import { Category, Prisma } from '@prisma/client';
import { CategoryDto } from './dto/category.dto';
import { generateSlug } from 'src/utils/generate-slug';

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
        return this.prisma.category.create({
            data: {
                name: '',
                slug: '',
                image: '',
            },

        })
    }
    async update(id: string, dto: CategoryDto)  {
        const category = await this.prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        try {
            return await this.prisma.category.update({
                where: { id },
                data: {
                    name: dto.name,
                    slug: generateSlug(dto.name),
                    image: dto.image,
               }
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
