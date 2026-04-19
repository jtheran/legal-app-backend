import jwt from 'jsonwebtoken';
import redisClient from '../config/redis';

export const generateToken = async (userId: string) => {
    const payload = { sub: userId };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '8h' });

    // Guardamos en Redis la sesión activa
    // Esto ayuda a mapear rápidamente qué abogado está operando
    await redisClient.set(`session:${userId}`, token, {
        EX: 60 * 60 * 8 // 8 horas de expiración en cache
    });

    return token;
};