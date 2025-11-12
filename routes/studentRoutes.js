import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  uploadStudents, 
  getAllStudents, 
  getUnassignedStudents,
  getStudentById,
  deleteStudent 
} from '../controllers/studentController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `students-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Only Excel files are allowed'));
    }
    cb(null, true);
  }
});

router.post('/upload', authenticate, authorizeRoles('admin'), upload.single('file'), uploadStudents);
router.get('/', authenticate, getAllStudents);
router.get('/unassigned', authenticate, authorizeRoles('admin'), getUnassignedStudents);
router.get('/:id', authenticate, getStudentById);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteStudent);

export default router;
