import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { CreateCaseInput } from '../schemas/case.schema';

export const createCase = async (req: Request, res: Response) => {
    try {
        const data = req.body as CreateCaseInput;
        const lawyer = req.user as any; // Inyectado por Passport

        const newCase = await prisma.case.create({
            data: {
                ...data,
                userId: lawyer.id // Vinculamos el caso al abogado autenticado
            }
        });

        res.status(201).json(newCase);
    } catch (error) {
        res.status(500).json({ message: "Error al crear el caso" });
    }
};