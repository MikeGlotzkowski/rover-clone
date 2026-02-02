import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
});

const createPetSchema = z.object({
  name: z.string().min(1),
  breed: z.string().optional(),
  size: z.string().refine(v => ['SMALL', 'MEDIUM', 'LARGE', 'GIANT'].includes(v)),
  age: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

// GET /users/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, location: true, role: true },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// PUT /users/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ error: 'Cannot update other users' });
    }

    const data = updateUserSchema.parse(req.body);
    
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, name: true, phone: true, location: true, role: true },
    });
    
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /users/:id/pets
router.get('/:id/pets', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const pets = await prisma.pet.findMany({
      where: { ownerId: req.params.id },
    });
    res.json(pets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get pets' });
  }
});

// POST /users/:id/pets
router.post('/:id/pets', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ error: 'Cannot add pets for other users' });
    }

    const data = createPetSchema.parse(req.body);
    
    const pet = await prisma.pet.create({
      data: {
        ...data,
        ownerId: req.params.id,
      },
    });
    
    res.status(201).json(pet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create pet' });
  }
});

export default router;
