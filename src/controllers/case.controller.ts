import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { CreateCaseInput  } from '../schemas/case.schemas';


// 1. Crear un nuevo caso judicial
export const createCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body as CreateCaseInput;

    // Verificar si el expediente ya existe de manera preventiva
    const existingCase = await prisma.case.findUnique({
      where: { folderNumber: data.folderNumber }
    });

    if (existingCase) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: [{ field: 'folderNumber', message: 'El número de expediente ya se encuentra registrado' }] 
      });
    }

    // El status viene parseado por Zod o cae en el default 'OPEN'
    const newCase = await prisma.case.create({
      data: {
        title: data.title,
        description: data.description,
        folderNumber: data.folderNumber,
        clientId: data.clientId,
        userId: data.userId,
        courtId: data.courtId,
        status: data.status as any // Cast al Enum de Prisma
      },
      include: {
        client: { select: { id: true, name: true } },
        lawyer: { select: { id: true, name: true, email: true } },
        court: true
      }
    });

    res.status(201).json({ message: 'Caso creado exitosamente', data: newCase });
  } catch (error) {
    next(error);
  }
};

// 2. Obtener listado de casos (con filtros opcionales por estado o abogado)
export const getCases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, userId } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (userId) filters.userId = String(userId);

    const cases = await prisma.case.findMany({
      where: filters,
      include: {
        client: { select: { name: true } },
        court: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: cases });
  } catch (error) {
    next(error);
  }
};

// 3. Obtener el detalle completo de un caso por ID
export const getCaseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const currentCase = await prisma.case.findUnique({
      where: { id },
      include: {
        client: true,
        lawyer: { select: { id: true, name: true, email: true } },
        court: true,
        documents: true
      }
    });

    if (!currentCase) {
      return res.status(404).json({ message: 'El caso judicial no fue encontrado' });
    }

    res.json({ data: currentCase });
  } catch (error) {
    next(error);
  }
};

// 4. Actualizar datos generales del caso
export const updateCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const data = req.body

    // Validación interna preventiva contra el Schema de actualización parcial
    const caseExists = await prisma.case.findUnique({ where: { id} });
    if (!caseExists) {
      return res.status(404).json({ message: 'Caso no encontrado' });
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        clientId: data.clientId,
        userId: data.userId,
        courtId: data.courtId,
        status: data.status as any
      }
    });

    res.json({ message: 'Caso actualizado de forma parcial', data: updatedCase });
  } catch (error) {
    next(error);
  }
};

// 5. Cambiar únicamente el estado del caso procesal
export const updateCaseStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body;

    const updatedCase = await prisma.case.update({
      where: { id },
      data: { status: status as any }
    });

    res.json({ message: `Estado del caso cambiado a ${status}`, data: updatedCase });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Caso no encontrado para actualizar estado' });
    }
    next(error);
  }
};

// 6. Asignar o reubicar el caso a un juzgado/corte
export const assignCourt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { courtId } = req.body;

    // Verificar primero la existencia del Juzgado
    const courtExists = await prisma.court.findUnique({ where: { id: courtId } });
    if (!courtExists) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: [{ field: 'courtId', message: 'El ID de juzgado ingresado no existe en el sistema' }]
      });
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: { courtId }
    });

    res.json({ message: 'Juzgado asignado correctamente al caso', data: updatedCase });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Caso no encontrado' });
    }
    next(error);
  }
};