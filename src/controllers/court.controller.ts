import { Request, Response } from 'express';
import { prisma } from '../config/db';
import logger from '../config/logger';

// 1. Listar juzgados con paginación y filtros opcionales (por tipo o ciudad)
export const getCourts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const { type, city, search } = req.query;

    // Construir filtros dinámicos
    const whereClause: any = { isActive: true }; // Por defecto solo activos para el día a día

    if (type) whereClause.type = type;
    if (city) whereClause.city = city as string;
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { judgeName: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Si es ADMIN y explícitamente pide ver los inactivos
    if (req.user?.role === 'ADMIN' && req.query.includeInactive === 'true') {
      delete whereClause.isActive;
    }

    const [courts, total] = await prisma.$transaction([
      prisma.court.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.court.count({ where: whereClause })
    ]);

    res.status(200).json({
      success: true,
      data: courts,
      meta: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error('Error al listar juzgados:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los juzgados.' });
  }
};

// 2. Obtener un juzgado por ID
export const getCourtById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string};
    const court = await prisma.court.findUnique({
      where: { id },
      include: {
        _count: { select: { cases: true } } // Muestra cuántos procesos lleva este juzgado
      }
    });

    if (!court) {
      res.status(404).json({ success: false, message: 'Despacho judicial no encontrado.' });
      return;
    }

    res.status(200).json({ success: true, data: court });
  } catch (error) {
    logger.error(`Error al obtener juzgado ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

// 3. Crear un nuevo despacho (Solo ADMIN)
export const createCourt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, judgeName, judgePhone, judgeEmail, city, state, country, address, email, notes } = req.body;

    const newCourt = await prisma.court.create({
      data: {
        name,
        type,
        judgeName,
        judgePhone,
        judgeEmail,
        city,
        state,
        country: country || 'Colombia',
        address,
        email,
        notes
      }
    });

    res.status(201).json({ success: true, data: newCourt });
  } catch (error) {
    logger.error('Error al crear juzgado:', error);
    res.status(500).json({ success: false, message: 'Error al registrar el despacho judicial.' });
  }
};

// 4. Actualizar despacho (Solo ADMIN)
export const updateCourt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string};
    const dataToUpdate = req.body;

    const updatedCourt = await prisma.court.update({
      where: { id },
      data: dataToUpdate
    });

    res.status(200).json({ success: true, data: updatedCourt });
  } catch (error) {
    logger.error(`Error al actualizar juzgado ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'No se pudo modificar el despacho judicial.' });
  }
};

// 5. Desactivar/Borrado lógico de un juzgado (Solo ADMIN)
export const deactivateCourt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string};

    const court = await prisma.court.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true, isActive: true }
    });

    res.status(200).json({
      success: true,
      message: `El despacho '${court.name}' ha sido marcado como inactivo.`,
      data: court
    });
  } catch (error) {
    logger.error(`Error al desactivar juzgado ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error al procesar el cambio de estado.' });
  }
};