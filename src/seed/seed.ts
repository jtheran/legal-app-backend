import bcrypt from 'bcrypt';
import config from '../config/config';
import { Role } from '@prisma/client';
import { prisma } from '../config/db';

export async function runSeed() {
  console.log('🌱 Iniciando el seeding...');

  // 1. Verificar si el administrador ya existe
  const existingAdmin = await prisma.user.findUnique({
    where: { email: config.ADMIN_EMAIL },
  });

  if (!existingAdmin) {
    // 2. Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(config.ADMIN_PASSWORD, 10);

    // 3. Crear el usuario administrador
    const newAdmin = await prisma.user.create({
      data: {
        email: config.ADMIN_EMAIL,
        password: hashedPassword,
        name: 'Administrador Sistema',
        dni: '12345678',
        role: Role.ADMIN,
      },
    });

    console.log(`✅ Administrador creado con éxito: ${newAdmin.email}`);
  } else {
    console.log('ℹ️ El administrador ya existe. Saltando creación.');
  }
}
