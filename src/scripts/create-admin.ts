import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';  // Changed from bcryptjs to bcrypt

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // You can change these values as needed
    const adminData = {
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
    };
    
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    
    const admin = await prisma.user.upsert({
      where: { email: adminData.email },
      update: { role: 'admin' },
      create: {
        email: adminData.email,
        password: hashedPassword,
        name: adminData.name,
        role: 'admin',
      },
    });
    
    console.log('Admin created successfully:', admin.id);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
