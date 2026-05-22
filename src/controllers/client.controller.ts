import { Request, Response } from 'express';
import { prisma } from '../config/db';
import logger from '../config/logger';

// 1. Listar clientes (Filtrado por abogado, a menos que sea ADMIN)
export const getClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Si es LAWYER, solo ve sus clientes. Si es ADMIN, puede ver todo.
    const whereClause = req.user?.role === 'ADMIN' ? {} : { userId: req.user?.id };

    const [clients, total] = await prisma.$transaction([
      prisma.client.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          _count: { select: { cases: true } } // Trae la cantidad de procesos activos
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.client.count({ where: whereClause })
    ]);

    res.status(200).json({
      success: true,
      data: clients,
      meta: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error('Error al listar clientes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los clientes.' });
  }
};

// 2. Obtener un cliente por ID (Con validación de propiedad)
export const getClientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string};

    const client = await prisma.client.findUnique({
      where: { id },
      include: { cases: true }
    });

    if (!client) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
      return;
    }

    // Restricción de seguridad básica
    if (req.user?.role !== 'ADMIN' && client.userId !== req.user?.id) {
      res.status(403).json({ success: false, message: 'No tienes permisos para ver este cliente.' });
      return;
    }

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    logger.error(`Error al obtener cliente ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

// 3. Crear un cliente (Asociado automáticamente al abogado logueado)
export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, companyName, address, dni, phone, email, city, state, country } = req.body;
    const userId = req.user?.id; // Tomado del token de autenticación obligatorio

    // Validar unicidad de DNI o Email
    const existingClient = await prisma.client.findFirst({
      where: { OR: [{ email }, { dni }] }
    });

    if (existingClient) {
      res.status(400).json({ success: false, message: 'Ya existe un cliente registrado con ese Email o DNI.' });
      return;
    }

    const newClient = await prisma.client.create({
      data: {
        name,
        type,
        companyName,
        address,
        dni,
        phone,
        email,
        city: city || 'Cartagena',
        state: state || 'Bolivar',
        country: country || 'Colombia',
        userId
      }
    });

    res.status(201).json({ success: true, data: newClient });
  } catch (error) {
    logger.error('Error al crear cliente:', error);
    res.status(500).json({ success: false, message: 'Error al registrar el cliente.' });
  }
};

// 4. Actualizar datos de un cliente
export const updateClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string};
    const dataToUpdate = req.body;

    const client = await prisma.client.findUnique({ where: { id } });

    if (!client) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
      return;
    }

    if (req.user?.role !== 'ADMIN' && client.userId !== req.user?.id) {
      res.status(403).json({ success: false, message: 'No tienes autorización para modificar este cliente.' });
      return;
    }

    // Excluimos userId y campos sensibles para evitar reasignaciones accidentales de abogado
    delete dataToUpdate.userId;
    delete dataToUpdate.id;

    const updatedClient = await prisma.client.update({
      where: { id },
      data: dataToUpdate
    });

    res.status(200).json({ success: true, data: updatedClient });
  } catch (error) {
    logger.error(`Error al actualizar cliente ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'No se pudo actualizar el cliente.' });
  }
};

// 5. Eliminar físicamente un cliente (Solo si no tiene casos asociados)
export const deleteClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string};

    const client = await prisma.client.findUnique({
      where: { id },
      include: { _count: { select: { cases: true } } }
    });

    if (!client) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
      return;
    }

    if (req.user?.role !== 'ADMIN' && client.userId !== req.user?.id) {
      res.status(403).json({ success: false, message: 'Acceso denegado.' });
      return;
    }

    // Integridad referencial manual antes del crash de base de datos
    if (client._count.cases > 0) {
      res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar el cliente porque posee expedientes judiciales o casos vinculados.' 
      });
      return;
    }

    await prisma.client.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: `El cliente ${client.name} ha sido removido del sistema con éxito.`
    });
  } catch (error) {
    logger.error(`Error al eliminar cliente ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error al procesar la eliminación.' });
  }
};