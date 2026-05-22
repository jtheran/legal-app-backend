import { Request, Response } from 'express';
import { prisma } from '../config/db';
import bcrypt from 'bcrypt'; // Cambiar por tu utilidad de hashing si usas otra
import logger from '../config/logger';


// 1. Obtener todos los usuarios (Abogados) con paginación
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        skip,
        take: limit,
        select: { id: true, email: true, dni: true, name: true, role: true, active: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    res.status(200).json({
      success: true,
      data: users,
      meta: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error('Error al listar usuarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios.' });
  }
};

// 2. Obtener un usuario específico por ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string};
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, dni: true, name: true, role: true, active: true, createdAt: true }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error(`Error al obtener usuario ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

// 3. Crear un nuevo Abogado/Admin
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, dni, name, role } = req.body;

    // Verificar si ya existe email o DNI
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { dni }] }
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'El Email o DNI ya se encuentra registrado.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, dni, name, role },
      select: { id: true, email: true, dni: true, name: true, role: true, active: true }
    });

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    logger.error('Error al crear usuario:', error);
    res.status(500).json({ success: false, message: 'Error al registrar el usuario.' });
  }
};

// 4. Actualizar datos del usuario
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string};
    const { email, dni, name, role } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { email, dni, name, role },
      select: { id: true, email: true, dni: true, name: true, role: true, active: true }
    });

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    logger.error(`Error al actualizar usuario ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'No se pudo actualizar el usuario.' });
  }
};

// 5. DESACTIVAR USUARIO (Soft Delete / Endpoint solicitado)
export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string};


    const user = await prisma.user.update({
      where: { id },
      data: { active: false },
      select: { id: true, name: true, active: true }
    });

    res.status(200).json({
      success: true,
      message: `El usuario ${user.name} ha sido desactivado correctamente.`,
      data: { id: user.id, active: user.active }
    });
  } catch (error) {
    logger.error(`Error al desactivar usuario ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error al procesar la desactivación.' });
  }
};