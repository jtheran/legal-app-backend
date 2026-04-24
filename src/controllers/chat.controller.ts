import { Request, Response } from 'express';
import { getChatResponse } from '../services/chat.services';

export const handleChatQuery = async (req: Request, res: Response) => {
    try {
        const { message, caseId } = req.body;
        const user = req.user as any;

        if (!message) {
            return res.status(400).json({ message: "El mensaje es obligatorio" });
        }

        const result = await getChatResponse(message, user.id);

        res.json(result);
    } catch (error) {
        console.error('Error en el Chatbot:', error);
        res.status(500).json({ message: "Error al procesar la consulta legal" });
    }
};