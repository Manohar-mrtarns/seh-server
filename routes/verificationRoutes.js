import express from 'express';
import { 
  verifyStudent, 
  getVerificationStats,
  resetVerification 
} from '../controllers/verificationController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/verify', authenticate, authorizeRoles('admin', 'teacher'), verifyStudent);
router.get('/stats', authenticate, getVerificationStats);
router.put('/reset/:studentId', authenticate, authorizeRoles('admin'), resetVerification);

export default router;
