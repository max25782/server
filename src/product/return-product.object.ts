import { Prisma } from "@prisma/client";
import { returnCategoryObject } from "src/category/return-category.object";

export const returnProductObject: Prisma.ProductSelect= {
    id: true,
    name: true,
    description: true,
    price: true,
    weight: true,
    length: true,
    createdAt: true,
    slug: true,
    image: true,
    category: { select: returnCategoryObject}
}