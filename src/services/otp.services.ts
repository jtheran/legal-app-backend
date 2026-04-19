import redisClient from '../config/redis';

export const saveOTP = async (email: string, code: string) => {
  // Guardamos el código con una expiración de 5 minutos (300 segundos)
  await redisClient.set(`otp:${email}`, code, { EX: 300 });
};

export const verifyOTP = async (email: string, code: string): Promise<boolean> => {
  const storedCode = await redisClient.get(`otp:${email}`);
  
  if (storedCode === code) {
    // Si es correcto, lo borramos para que no se use dos veces
    await redisClient.del(`otp:${email}`);
    return true;
  }
  
  return false;
};