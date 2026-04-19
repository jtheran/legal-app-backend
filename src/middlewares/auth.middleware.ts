import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

export const isAuth = passport.authenticate('jwt', { session: false });

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (user && user.role === 'ADMIN') {
        return next();
    }
    return res.status(403).json({ message: 'Acceso denegado: Se requieren permisos de Administrador' });
};