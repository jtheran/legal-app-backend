import multer from 'multer';
import config from './config';
import { s3Client } from './s3Client';
import multerS3 from 'multer-s3';
import path from 'path';

export const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: config.MINIO_BUCKET_NAME,
        acl: 'public-read',
        metadata: (req: any, file: Express.Multer.File, cb: any) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req: any, file: Express.Multer.File, cb: any) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `docs/${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    })
});