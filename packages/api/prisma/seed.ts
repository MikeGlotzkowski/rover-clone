import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  // Create pet owner
  const owner = await prisma.user.create({
    data: {
      email: 'owner@test.com',
      password,
      name: 'Alex Owner',
      phone: '555-0101',
      location: 'Brooklyn, NY',
      role: 'OWNER',
      pets: {
        create: [
          { name: 'Buddy', breed: 'Golden Retriever', size: 'LARGE', age: 3 },
          { name: 'Max', breed: 'Beagle', size: 'MEDIUM', age: 5 },
        ],
      },
    },
    include: { pets: true },
  });

  // Create providers
  const provider1 = await prisma.user.create({
    data: {
      email: 'sarah@test.com',
      password,
      name: 'Sarah Sitter',
      phone: '555-0102',
      location: 'Brooklyn, NY',
      role: 'PROVIDER',
      providerProfile: {
        create: {
          bio: 'Dog lover with 5 years of pet sitting experience. I have a big backyard and love taking dogs on adventures!',
          servicesOffered: '["BOARDING", "WALKING"]',
          dailyRate: 45,
          hourlyRate: 20,
          boardingCapacity: 3,
          walkingRadius: 2,
        },
      },
    },
  });

  const provider2 = await prisma.user.create({
    data: {
      email: 'mike@test.com',
      password,
      name: 'Mike Walker',
      phone: '555-0103',
      location: 'Manhattan, NY',
      role: 'PROVIDER',
      providerProfile: {
        create: {
          bio: 'Professional dog walker. I walk dogs rain or shine! Flexible schedule and great with all breeds.',
          servicesOffered: '["WALKING"]',
          hourlyRate: 25,
          walkingRadius: 3,
        },
      },
    },
  });

  const provider3 = await prisma.user.create({
    data: {
      email: 'emma@test.com',
      password,
      name: 'Emma Boarder',
      phone: '555-0104',
      location: 'Queens, NY',
      role: 'PROVIDER',
      providerProfile: {
        create: {
          bio: 'Retired vet tech. Your pet will be in expert hands! Comfortable with medications and special needs pets.',
          servicesOffered: '["BOARDING"]',
          dailyRate: 55,
          boardingCapacity: 2,
        },
      },
    },
  });

  // Create a sample booking
  const booking = await prisma.booking.create({
    data: {
      ownerId: owner.id,
      providerId: provider1.id,
      petId: owner.pets[0].id,
      serviceType: 'BOARDING',
      status: 'CONFIRMED',
      startDate: new Date('2026-02-10'),
      endDate: new Date('2026-02-15'),
      totalPrice: 225,
      notes: 'Buddy needs his medication twice daily',
    },
  });

  // Create a review
  await prisma.review.create({
    data: {
      bookingId: booking.id,
      authorId: owner.id,
      rating: 5,
      text: 'Sarah was amazing! Buddy had a great time and came home happy.',
    },
  });

  console.log('✅ Seed complete!');
  console.log('\nTest accounts (password: password123):');
  console.log('  Owner: owner@test.com');
  console.log('  Providers: sarah@test.com, mike@test.com, emma@test.com');
  console.log(`\nOwner has 2 pets: ${owner.pets.map(p => p.name).join(', ')}`);
  console.log(`Pet IDs: ${owner.pets.map(p => `${p.name}=${p.id}`).join(', ')}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
