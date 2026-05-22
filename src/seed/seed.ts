import bcrypt from 'bcrypt';
import config from '../config/config';
import { Role } from '@prisma/client';
import { prisma } from '../config/db';

export async function runSeed() {
  console.log('🌱 Iniciando el seeding...');

  // ==========================================
  // 1. SEED: ADMINISTRADOR SISTEMA
  // ==========================================
  const existingAdmin = await prisma.user.findUnique({
    where: { email: config.ADMIN_EMAIL },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(config.ADMIN_PASSWORD, 10);

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

  // ==========================================
  // 2. SEED: ABOGADO DE PRUEBAS (LAWYER)
  // ==========================================
  const LAWYER_EMAIL = 'abogado.test@legalapp.com'; // Puedes cambiarlo o moverlo a tu config
  
  const existingLawyer = await prisma.user.findUnique({
    where: { email: LAWYER_EMAIL },
  });

  if (!existingLawyer) {
    // Usamos una contraseña por defecto fácil de recordar para tus pruebas locales
    const hashedLawyerPassword = await bcrypt.hash('Abogado123*', 10);

    const newLawyer = await prisma.user.create({
      data: {
        email: LAWYER_EMAIL,
        password: hashedLawyerPassword,
        name: 'Dr. Alejandro Abogado Test',
        dni: '87654321',
        role: Role.LAWYER, // Asignamos el rol operativo para probar las restricciones
      },
    });

    console.log(`✅ Abogado de pruebas creado con éxito: ${newLawyer.email}`);
    console.log('🔑 Contraseña temporal del abogado: Abogado123*');
  } else {
    console.log('ℹ️ El abogado de pruebas ya existe. Saltando creación.');
  }

  console.log('🏁 Seeding completado con éxito.');
}