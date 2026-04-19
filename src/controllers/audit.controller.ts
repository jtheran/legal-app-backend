import { Request, Response } from 'express';
import { prisma } from '../config/db';
import logger from '../config/logger';
import { Parser } from 'json2csv';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      action, 
      resource, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Construcción dinámica de filtros
    const where: any = {};
    if (userId) where.userId = String(userId);
    if (action) where.action = String(action);
    if (resource) where.resource = String(resource);
    if (status) where.status = String(status);
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate));
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      data: logs,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error al obtener logs de auditoría:', error);
    res.status(500).json({ message: 'Error interno al consultar la auditoría' });
  }
};

export const getAuditDetails = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const log = await prisma.auditLog.findUnique({ where: { id } });

    if (!log) return res.status(404).json({ message: 'Registro no encontrado' });

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el detalle' });
  }
};

export const deleteAllLogs = async (req: Request, res: Response) => {
  try {
    const result = await prisma.auditLog.deleteMany({});
    
    logger.warn(`ELIMINACIÓN TOTAL: El admin ${ (req as any).user.email } borró ${result.count} registros.`);
    
    res.json({ message: `Se eliminaron ${result.count} registros con éxito.` });
  } catch (error) {
    logger.error('Error al borrar auditoría:', error);
    res.status(500).json({ message: 'Error al eliminar los registros.' });
  }
};

// 2. Exportar auditoría a archivo descargable
export const downloadAuditExportJson = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const fileName = `audit-export-${new Date().toISOString().split('T')[0]}.json`;
    const fileContent = JSON.stringify(logs, null, 2);

    // Configuramos los headers para que el navegador lo interprete como descarga
    res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-type', 'application/json');
    res.write(fileContent, 'binary');
    res.end();
    
    logger.info(`Exportación de auditoría descargada por ${(req as any).user.email}`);
  } catch (error) {
    logger.error('Error al exportar auditoría:', error);
    res.status(500).json({ message: 'Error al generar el archivo.' });
  }
};

export const downloadAuditExportCsv = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Definimos qué campos queremos en el Excel/CSV
    const fields = ['createdAt', 'userEmail', 'action', 'resource', 'status', 'ip', 'description'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(logs);

    const fileName = `auditoria-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csv);
    
    logger.info(`Auditoría exportada a CSV por ${(req as any).user.email}`);
  } catch (error) {
    logger.error('Error al exportar CSV:', error);
    res.status(500).json({ message: 'Error al generar el archivo CSV' });
  }
};