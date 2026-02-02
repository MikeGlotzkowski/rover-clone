'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { providersApi, bookingsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Provider {
  id: string;
  userId: string;
  bio: string;
  servicesOffered: string;
  dailyRate: number | null;
  hourlyRate: number | null;
  boardingCapacity?: number;
  user: {
    id: string;
    name: string;
    location: string;
  };
  reviews: Array<{
    id: string;
    rating: number;
    text: string;
    author: { name: string };
    createdAt: string;
  }>;
  avgRating: number | null;
}

export default function ProviderPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    serviceType: 'BOARDING',
    petId: '',
    startDate: '',
    endDate: '',
    walkDate: '',
    walkTime: '',
    duration: 30,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProvider();
  }, [params.id]);

  const loadProvider = async () => {
    try {
      const data = await providersApi.get(params.id as string);
      setProvider(data);
    } catch (err) {
      console.error('Failed to load provider:', err);
    } finally {
      setLoading(false);
    }
  };

  const getServices = () => {
    if (!provider) return [];
    try {
      return JSON.parse(provider.servicesOffered);
    } catch {
      return [];
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !provider) return;
    
    setSubmitting(true);
    try {
      await bookingsApi.create({
        providerId: provider.userId,
        petId: bookingData.petId,
        serviceType: bookingData.serviceType,
        ...(bookingData.serviceType === 'BOARDING' 
          ? { startDate: bookingData.startDate, endDate: bookingData.endDate }
          : { walkDate: bookingData.walkDate, walkTime: bookingData.walkTime, duration: bookingData.duration }
        ),
        notes: bookingData.notes,
      }, token);
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to create booking:', err);
      alert('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16">Loading...</div>;
  }

  if (!provider) {
    return <div className="text-center py-16 text-gray-500">Provider not found</div>;
  }

  const services = getServices();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl">
              🧑
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{provider.user.name}</h1>
              <p className="text-gray-500">{provider.user.location}</p>
              {provider.avgRating && (
                <div className="text-yellow-500 mt-2">
                  {'⭐'.repeat(Math.round(provider.avgRating))} {provider.avgRating.toFixed(1)} ({provider.reviews.length} reviews)
                </div>
              )}
            </div>
            
            {user && user.id !== provider.userId && (
              <button
                onClick={() => setShowBooking(!showBooking)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                Book Now
              </button>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-gray-600">{provider.bio || 'No bio provided.'}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Services & Pricing</h2>
            <div className="flex gap-4">
              {services.includes('BOARDING') && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🏠</div>
                  <div className="font-medium">Boarding</div>
                  <div className="text-green-700">${provider.dailyRate}/night</div>
                </div>
              )}
              {services.includes('WALKING') && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🚶</div>
                  <div className="font-medium">Dog Walking</div>
                  <div className="text-blue-700">${provider.hourlyRate}/hour</div>
                </div>
              )}
            </div>
          </div>

          {showBooking && user && (
            <div className="mt-8 bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Book with {provider.user.name}</h2>
              <form onSubmit={handleBook}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Service</label>
                  <select
                    value={bookingData.serviceType}
                    onChange={(e) => setBookingData({...bookingData, serviceType: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {services.includes('BOARDING') && <option value="BOARDING">Boarding</option>}
                    {services.includes('WALKING') && <option value="WALKING">Dog Walking</option>}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Pet ID (temporary)</label>
                  <input
                    type="text"
                    value={bookingData.petId}
                    onChange={(e) => setBookingData({...bookingData, petId: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Enter your pet's ID"
                    required
                  />
                </div>

                {bookingData.serviceType === 'BOARDING' ? (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Check-in</label>
                      <input
                        type="date"
                        value={bookingData.startDate}
                        onChange={(e) => setBookingData({...bookingData, startDate: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Check-out</label>
                      <input
                        type="date"
                        value={bookingData.endDate}
                        onChange={(e) => setBookingData({...bookingData, endDate: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={bookingData.walkDate}
                        onChange={(e) => setBookingData({...bookingData, walkDate: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Time</label>
                      <input
                        type="time"
                        value={bookingData.walkTime}
                        onChange={(e) => setBookingData({...bookingData, walkTime: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Duration</label>
                      <select
                        value={bookingData.duration}
                        onChange={(e) => setBookingData({...bookingData, duration: Number(e.target.value)})}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value={30}>30 min</option>
                        <option value={60}>60 min</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Notes (optional)</label>
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Any special instructions..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Booking...' : 'Request Booking'}
                </button>
              </form>
            </div>
          )}

          {provider.reviews.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Reviews</h2>
              <div className="space-y-4">
                {provider.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{review.author.name}</span>
                      <span className="text-yellow-500">{'⭐'.repeat(review.rating)}</span>
                    </div>
                    <p className="text-gray-600">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
