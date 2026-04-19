import { S3Client } from "@aws-sdk/client-s3";
import config from "./config";

export const s3Client = new S3Client({
    endpoint: config.MINIO_ENDPOINT,
    region: config.MINIO_REGION,
    credentials: {
        accessKeyId: config.MINIO_ACCESS_KEY,
        secretAccessKey: config.MINIO_SECRET_KEY,
    },
    forcePathStyle: true, // Obligatorio para MinIO
});