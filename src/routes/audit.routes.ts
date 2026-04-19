import { Router } from 'express';
import { getAuditLogs, getAuditDetails, downloadAuditExportJson, downloadAuditExportCsv, deleteAllLogs } from '../controllers/audit.controller';
import { isAuth, isAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', isAuth, isAdmin, getAuditLogs);

router.get('/:id', isAuth, isAdmin, getAuditDetails);

router.get('/export-json', isAuth, isAdmin, downloadAuditExportJson);

router.get('/export-csv', isAuth, isAdmin, downloadAuditExportCsv);

router.delete('/purge', isAuth, isAdmin, deleteAllLogs);

export default router;