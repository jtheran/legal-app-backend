import { prisma } from '../config/db';
import redisClient from '../config/redis';
import { qdrant } from '../config/qdrant';
import { s3Client } from '../config/s3Client';
import { ListBucketsCommand } from '@aws-sdk/client-s3'

export const checkInfrastructure = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redisClient.ping();
    await qdrant.getCollections();
    await s3Client.send(new ListBucketsCommand({}));
    console.log('🚀 Todas las bases de datos (Postgres, Redis, Qdrant) están listas.');
  } catch (error) {
    console.error('⚠️ Error de infraestructura:', error);
    process.exit(1);
  }
};