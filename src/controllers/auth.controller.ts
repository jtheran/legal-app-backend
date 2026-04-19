import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { generateToken } from '../services/auth.services';
import { createAuditLog } from '../services/audit.services';
import redisClient from '../config/redis';
import bcrypt from 'bcrypt';
import { isUserBlocked, registerFailedAttempt, clearFailedAttempts } from '../security/loginProtection';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // 1. Verificar bloqueo
        const blockStatus = await isUserBlocked(email)
        if (blockStatus.blocked) {
            return res.status(429).json({
                message: blockStatus.message,
                remainingSeconds: blockStatus.remainingSeconds,
            })
        }

        // 2. Buscar usuario
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            await createAuditLog({
                userEmail: email,
                action: 'LOGIN',
                resource: 'auth',
                status: 'FAILED',
                ip: req.ip,
                description: 'Intento de login con credenciales inválidas'
            });
            await registerFailedAttempt(email)
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 3. Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await createAuditLog({
                userEmail: email,
                action: 'LOGIN',
                resource: 'auth',
                status: 'FAILED',
                ip: req.ip,
                description: 'Intento de login con credenciales inválidas'
            });
            const result = await registerFailedAttempt(email)
            return res.status(401).json({ message: result.message })
        }

        // 4. Limpiar intentos fallidos
        await clearFailedAttempts(email)

        // 5. Generar JWT y registrar en Redis
        const token = await generateToken(user.id);

        // 6. Responder (sin enviar la contraseña)
        await createAuditLog({
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            action: 'LOGIN',
            resource: 'auth',
            status: 'SUCCESS',
            ip: req.ip,
            userAgent: req.get('user-agent'),
            description: 'Sesión iniciada correctamente'
        });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
    const { email, password, name, dni } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 12); // Salt rounds de 12 para alta seguridad
    
    const newUser = await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
            role: 'LAWYER',
            dni
        }
    });
    
    await createAuditLog({
            userId: newUser.id,
            userEmail: newUser.email,
            action: 'REGISTER',
            resource: 'auth',
            status: 'SUCCESS',
            ip: req.ip,
            userAgent: req.get('user-agent'),
            description: 'Nuevo abogado registrado en la plataforma'
        });
    res.status(201).json({ message: 'Abogado registrado correctamente' });
    } catch (error) {
        await createAuditLog({
            userEmail: req.body.email,
            action: 'REGISTER',
            resource: 'auth',
            status: 'FAILED',
            ip: req.ip,
            description: 'Intento de registro fallido',
            metadata: { error: (error as Error).message }
        });
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    // req.user viene inyectado por Passport gracias a la estrategia JWT
    if (!req.user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(req.user);
};

export const logout = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        if (user) {
            await createAuditLog({
                userId: user.id,
                userEmail: user.email,
                action: 'LOGOUT',
                resource: 'auth',
                status: 'SUCCESS',
                ip: req.ip,
                description: 'Sesión cerrada por el usuario'
            });
        }
        // Al cerrar sesión, eliminamos el rastro de Redis
        await redisClient.del(`session:${user.id}`);
        res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al cerrar sesión' });
    }
};