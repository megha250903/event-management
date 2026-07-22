import express from 'express';
import { 
  createEvent, 
  getEvents, 
  getEventById, 
  updateEvent, 
  deleteEvent 
} from '../controllers/eventController.js';
import { 
  registerForEvent, 
  getParticipants, 
  cancelParticipantRegistration 
} from '../controllers/registrationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Event CRUD
router.post('/', authenticateToken, createEvent);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.put('/:id', authenticateToken, updateEvent);
router.delete('/:id', authenticateToken, deleteEvent);

// Registrations / Participants
router.post('/:id/register', authenticateToken, registerForEvent);
router.get('/:id/participants', authenticateToken, getParticipants);
router.put('/:id/participants/:userId/cancel', authenticateToken, cancelParticipantRegistration);

export default router;
