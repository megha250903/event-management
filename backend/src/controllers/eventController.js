import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { EventModel } from '../models/eventModel.js';
import { RegistrationModel } from '../models/registrationModel.js';

const eventSchema = z.object({
  name: z.string().min(2, { message: 'Event name must be at least 2 characters long' }),
  description: z.string().optional().default(''),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid event date' }),
  location: z.string().min(2, { message: 'Location must be at least 2 characters long' }),
  imageUrl: z.string().url({ message: 'Invalid image URL format' }).optional().or(z.literal(''))
});

export const createEvent = async (req, res) => {
  try {
    const validation = eventSchema.safeParse(req.body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(', ');
      return res.status(400).json({ success: false, message: errors });
    }

    const { name, description, date, location, imageUrl } = validation.data;
    const ownerId = req.user.id;

    const event = await EventModel.create({
      name,
      description,
      date,
      location,
      ownerId,
      imageUrl
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (err) {
    console.error('Error in createEvent controller:', err);
    return res.status(500).json({ success: false, message: 'Internal server error creating event' });
  }
};

export const getEvents = async (req, res) => {
  try {
    const { search, location, startDate, endDate, sortBy, sortOrder } = req.query;

    const events = await EventModel.findAll({
      search: search ? String(search) : undefined,
      location: location ? String(location) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      sortBy: sortBy ? String(sortBy) : 'date',
      sortOrder: sortOrder ? String(sortOrder) : 'ASC'
    });

    return res.status(200).json({
      success: true,
      events
    });
  } catch (err) {
    console.error('Error in getEvents controller:', err);
    return res.status(500).json({ success: false, message: 'Internal server error fetching events' });
  }
};

export const getEventById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const event = await EventModel.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Optionally check if requesting user is registered
    let registration = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || 'super_secret_event_manager_token_key_123!@#';
        const decoded = jwt.verify(token, secret);
        registration = await RegistrationModel.findByEventAndUser(id, decoded.id);
      } catch (err) {
        // Ignore token error and proceed with null registration info
      }
    }

    return res.status(200).json({
      success: true,
      event,
      registration
    });
  } catch (err) {
    console.error('Error in getEventById controller:', err);
    return res.status(500).json({ success: false, message: 'Internal server error fetching event details' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const event = await EventModel.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Verify owner
    if (event.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this event' });
    }

    const validation = eventSchema.safeParse(req.body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(', ');
      return res.status(400).json({ success: false, message: errors });
    }

    const updatedEvent = await EventModel.update(id, validation.data);

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (err) {
    console.error('Error in updateEvent controller:', err);
    return res.status(500).json({ success: false, message: 'Internal server error updating event' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const event = await EventModel.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Verify owner
    if (event.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this event' });
    }

    await EventModel.delete(id);

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteEvent controller:', err);
    return res.status(500).json({ success: false, message: 'Internal server error deleting event' });
  }
};
