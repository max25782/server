import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from 'src/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import * as QRCode from 'qrcode';

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generateOrderPdf(orderId: string): Promise<Buffer> {
    // Получаем данные о заказе
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Создаем QR-код с информацией о заказе
    const orderInfo = {
      id: order.id,
      date: order.createdAt,
      total: order.total,
      customerName: order.user?.name || 'Guest',
      customerEmail: order.user?.email || '',
      items: order.items.map(item => ({
        product: item.product?.name || 'Unknown Product',
        quantity: item.quantity,
        price: item.price,
        length: typeof item.product?.length === 'number' ? item.product.length : 0,
        weight: typeof item.product?.weight === 'number' ? item.product.weight : 0
      }))
    };
    
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(orderInfo), {
      width: 150,
      margin: 1
    });

    // Создаем PDF документ
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    // Собираем буферы из потока PDF
    doc.on('data', buffers.push.bind(buffers));

    // Формируем PDF
    this.generateHeader(doc);
    this.generateQRCode(doc, qrCodeDataUrl, order.id);
    this.generateCustomerInfo(doc, order);
    this.generateOrderInfo(doc, order);
    await this.generateOrderTable(doc, order);
    this.generateTotalCalculation(doc, order);
    this.generateFooter(doc);

    // Завершаем документ
    doc.end();

    // Возвращаем обещание, которое резолвится в буфер данных PDF
    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
    });
  }

  private generateHeader(doc: PDFKit.PDFDocument) {
    try {
      // Проверяем существование файла логотипа
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 50 });
      }
    } catch (error) {
      console.error('Error loading logo:', error);
    }

    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('Delivery App', 110, 57)
      .fontSize(10)
      .text('Delivery App', 200, 50, { align: 'right' })
      .text('123 Main Street', 200, 65, { align: 'right' })
      .text('New York, NY, 10025', 200, 80, { align: 'right' })
      .moveDown();
  }

  private generateQRCode(doc: PDFKit.PDFDocument, qrCodeDataUrl: string, orderId: string) {
    doc
      .image(qrCodeDataUrl, 450, 45, { width: 100 })
      .fontSize(8)
      .text(`Scan to view order #${orderId}`, 450, 150, { width: 100, align: 'center' });
  }

  private generateCustomerInfo(doc: PDFKit.PDFDocument, order: any) {
    doc
      .fillColor('#444444')
      .fontSize(16)
      .text('Информация о клиенте', 50, 130);

    this.generateHr(doc, 150);

    const customerInfo = {
      name: order.user?.name || 'Гость',
      email: order.user?.email || 'Нет email',
      phone: order.user?.phone || 'Нет телефона',
      address: order.user?.address || 'Нет адреса',
    };

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Имя:', 50, 165)
      .font('Helvetica')
      .text(customerInfo.name, 150, 165)
      .font('Helvetica-Bold')
      .text('Email:', 50, 180)
      .font('Helvetica')
      .text(customerInfo.email, 150, 180)
      .font('Helvetica-Bold')
      .text('Телефон:', 50, 195)
      .font('Helvetica')
      .text(customerInfo.phone, 150, 195)
      .font('Helvetica-Bold')
      .text('Адрес:', 50, 210)
      .font('Helvetica')
      .text(customerInfo.address, 150, 210)
      .moveDown();
  }

  private generateOrderInfo(doc: PDFKit.PDFDocument, order: any) {
    doc
      .fillColor('#444444')
      .fontSize(16)
      .text('Информация о заказе', 50, 250);

    this.generateHr(doc, 270);

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Номер заказа:', 50, 285)
      .font('Helvetica')
      .text(order.id, 150, 285)
      .font('Helvetica-Bold')
      .text('Дата заказа:', 50, 300)
      .font('Helvetica')
      .text(formatDate(order.createdAt), 150, 300)
      .font('Helvetica-Bold')
      .text('Сумма заказа:', 50, 315)
      .font('Helvetica')
      .text(`$${(order.total / 100).toFixed(2)}`, 150, 315)
      .moveDown();
  }

  private async generateOrderTable(doc: PDFKit.PDFDocument, order: any) {
    doc
      .fillColor('#444444')
      .fontSize(16)
      .text('Товары', 50, 350);

    this.generateHr(doc, 370);

    let currentY = 390;
    const margin = 50;
    
    // Заголовки таблицы
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Изображение', margin, currentY)
      .text('Название', margin + 100, currentY)
      .text('Описание', margin + 200, currentY)
      .text('Длина (м)', margin + 300, currentY)
      .text('Вес (кг)', margin + 350, currentY)
      .text('Цена', margin + 400, currentY)
      .text('Кол-во', margin + 440, currentY)
      .text('Сумма', margin + 480, currentY);
    
    currentY += 20;
    this.generateHr(doc, currentY);
    currentY += 10;

    // Содержимое таблицы
    for (const item of order.items) {
      const product = item.product;
      const imageHeight = 60;
      
      // Обрабатываем изображение
      try {
        const imagePath = path.join(process.cwd(), product.image.replace(/^\//, ''));
        if (fs.existsSync(imagePath)) {
          doc.image(imagePath, margin, currentY, { width: 60, height: imageHeight });
        } else {
          doc.rect(margin, currentY, 60, imageHeight).stroke();
          doc.fontSize(8).text('No image', margin + 15, currentY + 25);
        }
      } catch (error) {
        console.error(`Error adding image for product ${product.id}:`, error);
        doc.rect(margin, currentY, 60, imageHeight).stroke();
        doc.fontSize(8).text('Error', margin + 20, currentY + 25);
      }

      // Форматируем длину и вес
      const lengthValue = item.length ? item.length.toString() : "—";
      const weightValue = item.weight ? item.weight.toString() : "—";

      // Добавляем информацию о продукте
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(product.name, margin + 100, currentY)
        .text(
          product.description 
            ? product.description.substring(0, 30) + (product.description.length > 30 ? '...' : '') 
            : '—', 
          margin + 200, currentY
        )
        .text(lengthValue, margin + 300, currentY)
        .text(weightValue, margin + 350, currentY)
        .text(`$${(item.price / 100).toFixed(2)}`, margin + 400, currentY)
        .text(item.quantity.toString(), margin + 440, currentY)
        .text(`$${((item.price * item.quantity) / 100).toFixed(2)}`, margin + 480, currentY);

      currentY += imageHeight + 10;
      this.generateHr(doc, currentY);
      currentY += 10;

      // Проверяем, не вышли ли мы за пределы страницы
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
        this.generateHr(doc, currentY);
        currentY += 10;
      }
    }

    // Возвращаем текущую позицию Y для дальнейшего использования
    return currentY;
  }

  private generateTotalCalculation(doc: PDFKit.PDFDocument, order: any) {
    // Вычисляем общий вес и длину
    let totalWeight = 0;
    let totalLength = 0;
    
    for (const item of order.items) {
      if (item.weight) {
        totalWeight += item.weight * item.quantity;
      }
      
      if (item.length) {
        totalLength += item.length * item.quantity;
      }
    }
    
    // Добавляем итоговые данные
    const y = doc.y + 20;
    const margin = 50;
    
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Итоговые данные:', margin, y)
      .moveDown(0.5);
      
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Общая длина:', margin, doc.y)
      .font('Helvetica')
      .text(`${totalLength.toFixed(2)} м`, margin + 150, doc.y)
      .moveDown(0.5);
      
    doc
      .font('Helvetica-Bold')
      .text('Общий вес:', margin, doc.y)
      .font('Helvetica')
      .text(`${totalWeight.toFixed(2)} кг`, margin + 150, doc.y)
      .moveDown(0.5);
      
    doc
      .font('Helvetica-Bold')
      .text('Общая сумма:', margin, doc.y)
      .font('Helvetica')
      .text(`$${(order.total / 100).toFixed(2)}`, margin + 150, doc.y)
      .moveDown();
  }

  private generateFooter(doc: PDFKit.PDFDocument) {
    doc
      .fontSize(10)
      .text(
        'Спасибо за ваш заказ! Будем рады видеть вас снова.',
        50,
        doc.page.height - 50,
        { align: 'center', width: 500 }
      );
  }

  private generateHr(doc: PDFKit.PDFDocument, y: number) {
    doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
  }
}

function formatDate(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
} 