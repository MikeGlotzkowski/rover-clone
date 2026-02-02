import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const createBookingSchema = z.object({
  providerId: z.string(),
  petId: z.string(),
  serviceType: z.string().refine(v => ['BOARDING', 'WALKING'].includes(v)),
  // Boarding fields
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // Walking fields
  walkDate: z.string().optional(),
  walkTime: z.string().optional(),
  duration: z.number().int().optional(),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.string().refine(v => ['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(v)),
});

// POST /bookings - Create a new booking
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const data = createBookingSchema.parse(req.body);
    
    // Validate pet belongs to user
    const pet = await prisma.pet.findFirst({
      where: { id: data.petId, ownerId: req.userId },
    });
    if (!pet) {
      return res.status(400).json({ error: 'Pet not found or not yours' });
    }
    
    // Validate provider exists
    const provider = await prisma.providerProfile.findFirst({
      where: { userId: data.providerId },
    });
    if (!provider) {
      return res.status(400).json({ error: 'Provider not found' });
    }
    
    // Calculate price (simple logic for MVP)
    let totalPrice = 0;
    if (data.serviceType === 'BOARDING' && data.startDate && data.endDate) {
      const days = Math.ceil(
        (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      totalPrice = days * (provider.dailyRate || 50);
    } else if (data.serviceType === 'WALKING' && data.duration) {
      const hours = data.duration / 60;
      totalPrice = hours * (provider.hourlyRate || 25);
    }

    const booking = await prisma.booking.create({
      data: {
        ownerId: req.userId!,
        providerId: data.providerId,
        petId: data.petId,
        serviceType: data.serviceType,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        walkDate: data.walkDate ? new Date(data.walkDate) : null,
        walkTime: data.walkTime,
        duration: data.duration,
        notes: data.notes,
        totalPrice,
        status: 'PENDING',
      },
      include: {
        pet: true,
        provider: { select: { id: true, name: true } },
      },
    });
    
    res.status(201).json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /bookings - Get user's bookings (as owner or provider)
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { role } = req.query; // 'owner' or 'provider'
    
    const where = role === 'provider'
      ? { providerId: req.userId }
      : { ownerId: req.userId };
    
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        pet: true,
        owner: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// GET /bookings/:id - Get single booking
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { ownerId: req.userId },
          { providerId: req.userId },
        ],
      },
      include: {
        pet: true,
        owner: { select: { id: true, name: true, phone: true } },
        provider: { select: { id: true, name: true, phone: true } },
      },
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get booking' });
  }
});

// PUT /bookings/:id/status - Update booking status
router.put('/:id/status', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const data = updateStatusSchema.parse(req.body);
    
    const booking = await prisma.booking.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { ownerId: req.userId },
          { providerId: req.userId },
        ],
      },
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Only provider can confirm, both can cancel
    if (data.status === 'CONFIRMED' && booking.providerId !== req.userId) {
      return res.status(403).json({ error: 'Only provider can confirm' });
    }
    
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: data.status },
      include: {
        pet: true,
        owner: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true } },
      },
    });
    
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// POST /bookings/:id/review - Add review for completed booking
router.post('/:id/review', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { rating, text } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be 1-5' });
    }
    
    const booking = await prisma.booking.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.userId,
        status: 'COMPLETED',
      },
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Completed booking not found' });
    }
    
    // Check if already reviewed
    const existing = await prisma.review.findFirst({
      where: { bookingId: booking.id },
    });
    if (existing) {
      return res.status(400).json({ error: 'Already reviewed' });
    }
    
    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        authorId: req.userId!,
        rating,
        text,
      },
    });
    
    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

export default router;
