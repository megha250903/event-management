import { z } from 'zod';
import { RegistrationModel } from '../models/registrationModel.js';
import { EventModel } from '../models/eventModel.js';

const cancelSchema = z.object({
  reason: z.string().min(3, { message: 'Reason must be at least 3 characters long' }).max(500)
});

export const registerForEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Owner should not register for their own event
    if (event.owner_id === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot register as a participant for an event you own' 
      });
    }

    const registration = await RegistrationModel.register({
      eventId,
      userId: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Successfully registered for this event',
      registration
    });
  } catch (err) {
    console.error('Error in registerForEvent controller:', err);
    return res.status(500).json({ success: false, message: 'Internal server error registering for event' });
  }
};

export const getParticipants = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Verify owner
    if (event.owner_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden. Only the event owner can view the participants list.' 
      });
    }

    const participants = await RegistrationModel.findParticipantsByEventId(eventId);

    return res.status(200).json({
      success: true,
      participants
    });
  } catch (err) {
    console.error('Error in getParticipants controller:', err);
    return res.status(500).json({ success: false, message: 'Internal server error fetching participants list' });
  }
};

export const cancelParticipantRegistration = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(eventId) || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID or user ID' });
    }

    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Verify owner
    if (event.owner_id !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden. Only the event owner can cancel participant registrations.' 
      });
    }

    const validation = cancelSchema.safeParse(req.body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(', ');
      return res.status(400).json({ success: false, message: errors });
    }

    const { reason } = validation.data;

    // Check if registration exists
    const reg = await RegistrationModel.findByEventAndUser(eventId, userId);
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const updatedReg = await RegistrationModel.cancelRegistration(eventId, userId, reason);

    return res.status(200).json({
      success: true,
      message: 'Participant registration cancelled successfully',
      registration: updatedReg
    });
  } catch (err) {
    console.error('Error in cancelParticipantRegistration controller:', err);
    return res.status(500).json({ success: false, message: 'Internal server error cancelling registration' });
  }
};
