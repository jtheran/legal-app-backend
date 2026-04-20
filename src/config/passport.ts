import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
import { prisma } from './db'; // Tu instancia de Prisma
import config from './config';
import logger from './logger';

const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.JWT_SECRET,
};

passport.use(
    'jwt',
    new Strategy(options, async (payload, done) => {
        try {
            // Buscamos el abogado en la DB
            const user = await prisma.user.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    dni: true,
                    createdAt: true,
                },
            });

            if(user){
                logger.info(`Usuario ${user.email} autenticado correctamente`);
                return done(null, user);
            }

            logger.warn(`Usuario ${payload.email} no encontrado`);
            return done(null, false);
        } catch (error) {
            logger.error(`Error al autenticar usuario: ${error}`);
            return done(error, false);
        }
    })
);

export default passport;