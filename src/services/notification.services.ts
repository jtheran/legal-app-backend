import { emailQueue } from '../queues/mail.queue';

export const sendOTPVerification = async (email: string, code: string) => {
  await emailQueue.add('sendOTP', {
    to: email,
    subject: 'Tu código de verificación - Legal App',
    template: `<h1>Código: ${code}</h1><p>Válido por 5 minutos.</p>`,
  }, {
    attempts: 3, // Reintentar 3 veces si falla
    backoff: { type: 'exponential', delay: 5000 } // Esperar 5s, luego 10s...
  });
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  await emailQueue.add('sendWelcome', {
    to: email,
    subject: `¡Bienvenido(a), ${name}!`,
    template: `<p>Hola ${name}, tu cuenta ha sido creada exitosamente en la plataforma legal.</p>`,
  });
};