import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
import { prisma } from './db'; // Tu instancia de Prisma

const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'secret_legal_app_2026',
};

passport.use(
    new Strategy(options, async (payload, done) => {
        try {
            // Buscamos el abogado en la DB
            const user = await prisma.user.findUnique({ where: { id: payload.sub } });
            
            if (user) {
                return done(null, user);
            }
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

export default passport;