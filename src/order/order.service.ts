import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { returnProductObject } from 'src/product/return-product.object';
import Stripe from 'stripe';
import { OrderDto } from './dto/order.dto';

@Injectable()
export class OrderService {
    private stripe: Stripe

    constructor(private prisma: PrismaService) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY environment variable is not set');
        }
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }

    async getAll() {
        return this.prisma.order.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: returnProductObject
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true
                    }
                }
            }
        });
    }
    
    async getByUser(userId:string) {
        return this.prisma.order.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: returnProductObject
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true
                    }
                }
            }
        });
    }

    async placeOrder(dto: OrderDto, userId: string) { 
        console.log('Placing order with items:', JSON.stringify(dto.items, null, 2));
        
        const total = dto.items.reduce((acc, item) => acc + item.price * item.quantity, 0)

        if (total < 0.5) {
            throw new Error('Amount must be at least $0.5')
        }

        const productsInfo = await Promise.all(
            dto.items.map(async item => {
                const product = await this.prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { length: true, weight: true }
                });
                
                let lengthValue = 0;
                
                if (item.length !== undefined && item.length !== null) {
                    if (typeof item.length === 'string') {
                        const lengthStr = item.length as string;
                        lengthValue = parseFloat(lengthStr.replace(/[^\d.]/g, ''));
                    } else if (typeof item.length === 'number') {
                        lengthValue = item.length;
                    }
                } else if (product?.length !== undefined && product?.length !== null) {
                    lengthValue = product.length;
                }

                let weightValue = 0;
                if (item.weight !== undefined && item.weight !== null) {
                    if (typeof item.weight === 'string') {
                        const weightStr = item.weight as string;
                        weightValue = parseFloat(weightStr.replace(/[^\d.]/g, ''));
                    } else if (typeof item.weight === 'number') {
                        weightValue = item.weight;
                    }
                } else if (product?.weight !== undefined && product?.weight !== null) {
                    weightValue = product.weight;
                }
                
                return {
                    price: item.price,
                    quantity: item.quantity,
                    productId: item.productId,
                    length: lengthValue,
                    weight: weightValue
                };
            })
        );
        
        console.log('Enhanced order items with length/weight:', JSON.stringify(productsInfo, null, 2));

        const order = await this.prisma.order.create({
            data: {
                items: {
                    create: productsInfo
                },
                total,
                user: {
                    connect: {
                        id: userId
                    }
                }
            }
        });

        const totalInCents = Math.round(total * 100);

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: totalInCents,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true
            },
            description: `Order by userId ${order.userId}`,
        });
        
        return { 
            clientSecret: paymentIntent.client_secret,
            orderId: order.id
        };
    }

    async deleteOrder(id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id }
        });

        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        await this.prisma.orderItem.deleteMany({
            where: { orderId: id }
        });

        return this.prisma.order.delete({
            where: { id }
        });
    }
}
