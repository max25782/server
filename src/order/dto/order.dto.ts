import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";

export class OrderItemDto {
    @IsNumber()
    price: number;

     @IsString()
    productId: string;

     @IsNumber()
     quantity: number;
     
     @IsOptional()
     @IsNumber()
     length?: number;
     
     @IsOptional()
     @IsNumber()
     weight?: number;
}

export class OrderDto {
    @IsArray()
    items: OrderItemDto[];
}