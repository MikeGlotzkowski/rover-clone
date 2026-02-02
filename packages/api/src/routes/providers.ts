import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const updateProviderSchema = z.object({
  bio: z.string().optional(),
  photos: z.string().optional(), // JSON array of URLs
  servicesOffered: z.string(), // JSON: ["BOARDING", "WALKING"]
  hourlyRate: z.number().positive().optional(),
  dailyRate: z.number().positive().optional(),
  boardingCapacity: z.number().int().positive().optional(),
  walkingRadius: z.number().positive().optional(),
});

// GET /providers - List all providers
router.get('/', async (req, res) => {
  try {
    const providers = await prisma.providerProfile.findMany({
      include: {
        user: {
          select: { id: true, name: true, location: true },
        },
      },
    });
    res.json(providers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get providers' });
  }
});

// GET /providers/search - Search providers with filters
router.get('/search', async (req, res) => {
  try {
    const { location, service, minPrice, maxPrice } = req.query;
    
    const where: any = {};
    
    if (service) {
      where.servicesOffered = { contains: service as string };
    }
    
    if (minPrice || maxPrice) {
      where.OR = [
        { dailyRate: { gte: Number(minPrice) || 0, lte: Number(maxPrice) || 99999 } },
        { hourlyRate: { gte: Number(minPrice) || 0, lte: Number(maxPrice) || 99999 } },
      ];
    }

    const providers = await prisma.providerProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, location: true },
        },
      },
    });
    
    // Filter by location if provided (simple string match for MVP)
    let results = providers;
    if (location) {
      const loc = (location as string).toLowerCase();
      results = providers.filter(p => 
        p.user.location?.toLowerCase().includes(loc)
      );
    }
    
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /providers/:id - Get provider by ID
router.get('/:id', async (req, res) => {
  try {
    const provider = await prisma.providerProfile.findFirst({
      where: { userId: req.params.id },
      include: {
        user: {
          select: { id: true, name: true, location: true },
        },
      },
    });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Get reviews for this provider
    const reviews = await prisma.review.findMany({
      where: {
        booking: { providerId: req.params.id },
      },
      include: {
        author: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;
    
    res.json({ ...provider, reviews, avgRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get provider' });
  }
});

// PUT /providers/:id - Update provider profile
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ error: 'Cannot update other providers' });
    }

    const data = updateProviderSchema.parse(req.body);
    
    // Upsert - create if doesn't exist
    const provider = await prisma.providerProfile.upsert({
      where: { userId: req.params.id },
      update: data,
      create: {
        ...data,
        userId: req.params.id,
      },
      include: {
        user: {
          select: { id: true, name: true, location: true },
        },
      },
    });
    
    // Update user role to include PROVIDER
    await prisma.user.update({
      where: { id: req.params.id },
      data: { role: 'BOTH' },
    });
    
    res.json(provider);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to update provider' });
  }
});

// GET /providers/:id/reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        booking: { providerId: req.params.id },
      },
      include: {
        author: { select: { name: true } },
        booking: { select: { serviceType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

export default router;
