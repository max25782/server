import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { hash } from 'argon2';
import { I18nService } from 'nestjs-i18n';

interface ProductStat {
  id: string;
  name: string;
  totalQuantity: number;
  totalOrders: number;
  totalWeight: number;
  totalLength: number;
  users: Set<string>;
}

interface UserProductStat {
  userId: string;
  userName: string;
  userEmail: string;
  products: Record<string, {
    id: string;
    name: string;
    quantity: number;
    orders: number;
    weight: number;
    length: number;
    totalWeight: number;
    totalLength: number;
  }>;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService
  ) {}

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  async findAllOrders() {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });
  }

  async getProductsStats() {
    // Получаем все заказы с предметами и пользователями
    const orders = await this.prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });

    // Создаем хеш-таблицу для хранения статистики по продуктам
    const productStats: Record<string, ProductStat> = {};
    const userProductStats: Record<string, UserProductStat> = {};

    // Обрабатываем каждый заказ
    orders.forEach(order => {
      const userId = order.user?.id || 'unknown';
      const userName = order.user?.name || 'Unknown User';
      const userEmail = order.user?.email || 'unknown@email.com';

      // Если пользователя еще нет в статистике, добавляем его
      if (!userProductStats[userId]) {
        userProductStats[userId] = {
          userId,
          userName,
          userEmail,
          products: {}
        };
      }

      // Обрабатываем каждый предмет в заказе
      order.items.forEach(item => {
        // Проверка на null
        if (!item.product) return;
        
        const productId = item.product.id;
        const productName = item.product.name;
        const quantity = item.quantity || 1;
        const weight = item.product.weight || 0;
        const length = item.product.length || 0;

        // Обновляем общую статистику продуктов
        if (!productStats[productId]) {
          productStats[productId] = {
            id: productId,
            name: productName,
            totalQuantity: 0,
            totalOrders: 0,
            totalWeight: 0,
            totalLength: 0,
            users: new Set<string>()
          };
        }
        productStats[productId].totalQuantity += quantity;
        productStats[productId].totalOrders += 1;
        productStats[productId].totalWeight += weight * quantity;
        productStats[productId].totalLength += length * quantity;
        productStats[productId].users.add(userId);

        // Обновляем статистику продуктов для пользователя
        if (!userProductStats[userId].products[productId]) {
          userProductStats[userId].products[productId] = {
            id: productId,
            name: productName,
            quantity: 0,
            orders: 0,
            weight: weight,
            length: length,
            totalWeight: 0,
            totalLength: 0
          };
        }
        userProductStats[userId].products[productId].quantity += quantity;
        userProductStats[userId].products[productId].orders += 1;
        userProductStats[userId].products[productId].totalWeight += weight * quantity;
        userProductStats[userId].products[productId].totalLength += length * quantity;
      });
    });

    // Преобразуем хеш-таблицы в массивы
    const productStatsArray = Object.values(productStats).map(product => ({
      id: product.id,
      name: product.name,
      totalQuantity: product.totalQuantity,
      totalOrders: product.totalOrders,
      totalWeight: product.totalWeight,
      totalLength: product.totalLength,
      uniqueUsers: product.users.size,
      users: Array.from(product.users)
    }));

    const userProductStatsArray = Object.values(userProductStats).map(user => ({
      userId: user.userId,
      userName: user.userName,
      userEmail: user.userEmail,
      products: Object.values(user.products)
    }));

    return {
      productStats: productStatsArray,
      userProductStats: userProductStatsArray,
      summary: {
        totalProducts: productStatsArray.length,
        totalUsers: userProductStatsArray.length,
        totalOrders: orders.length,
        totalItems: orders.reduce((acc, order) => acc + order.items.length, 0)
      }
    };
  }

  async createAdmin(email: string, password: string, name: string, lang = 'en') {
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      const message = await this.i18n.translate('admin.user_exists', { lang });
      throw new BadRequestException(message);
    }

    const hashedPassword = await hash(password);

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'admin'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
  }

  async makeUserAdmin(userId: string, lang = 'en') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      const message = await this.i18n.translate('admin.user_not_found', { lang });
      throw new NotFoundException(message);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: 'admin' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
  }
} 