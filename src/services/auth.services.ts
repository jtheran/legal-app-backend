import jwt from 'jsonwebtoken';
import redisClient from '../config/redis';
import config from '../config/config';

export const generateToken = async (userId: string) => {
    const payload = { sub: userId };
    const accessToken = jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: config.JWT_REFRESH_EXPIRES_IN });

    // Guardamos en Redis la sesión activa
    // Esto ayuda a mapear rápidamente qué abogado está operando
    await redisClient.set(`session:access:${userId}`, accessToken, {
        EX: config.JWT_EXPIRES_IN
    });

    await redisClient.set(`session:refresh:${userId}`, refreshToken, {
        EX: config.JWT_REFRESH_EXPIRES_IN
    });

    return { accessToken, refreshToken};
};