import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport'; // Importa el tipo de SMTP
import config from './config';

const mailConfig: SMTPTransport.Options = {
  host: config.EMAIL_HOST,
  port: Number(config.EMAIL_PORT),
  secure: config.EMAIL_ENCRYPTION, // Asegura que sea boolean
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASSWORD,
  },
  // Opcional: útil para debug en desarrollo
  debug: config.NODE_ENV === 'development',
  logger: config.NODE_ENV === 'development'
};

export const mailTransporter = nodemailer.createTransport(mailConfig);