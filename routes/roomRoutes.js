import express from 'express';
import { 
  createRoom, 
  getAllRooms, 
  getRoomById,
  allocateSeats,
  deleteRoom 
} from '../controllers/roomController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, authorizeRoles('admin'), createRoom);
router.get('/', authenticate, getAllRooms);
router.get('/:id', authenticate, getRoomById);
router.post('/allocate', authenticate, authorizeRoles('admin'), allocateSeats);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteRoom);

export default router;
