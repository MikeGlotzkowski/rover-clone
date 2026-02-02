'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsApi } from '@/lib/api';

interface Booking {
  id: string;
  serviceType: string;
  status: string;
  startDate?: string;
  endDate?: string;
  walkDate?: string;
  walkTime?: string;
  duration?: number;
  totalPrice?: number;
  notes?: string;
  pet: { name: string; breed?: string };
  owner?: { name: string };
  provider?: { name: string };
}

export default function DashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'owner' | 'provider'>('owner');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (token) {
      loadBookings();
    }
  }, [token, view]);

  const loadBookings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await bookingsApi.list(token, view);
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    if (!token) return;
    try {
      await bookingsApi.updateStatus(bookingId, status, token);
      loadBookings();
    } catch (err) {
      console.error('Failed to update booking:', err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || !user) {
    return <div className="text-center py-16">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {(user.role === 'PROVIDER' || user.role === 'BOTH') && (
          <div className="flex gap-2">
            <button
              onClick={() => setView('owner')}
              className={`px-4 py-2 rounded-lg ${
                view === 'owner' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}
            >
              As Pet Owner
            </button>
            <button
              onClick={() => setView('provider')}
              className={`px-4 py-2 rounded-lg ${
                view === 'provider' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}
            >
              As Provider
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <p className="text-gray-500 mb-4">
            {view === 'owner'
              ? "You haven't made any bookings yet."
              : "You don't have any booking requests yet."}
          </p>
          {view === 'owner' && (
            <a
              href="/search"
              className="text-green-600 hover:underline"
            >
              Find a sitter →
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-medium">
                      {booking.serviceType === 'BOARDING' ? '🏠 Boarding' : '🚶 Walk'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Pet: {booking.pet.name}
                    {booking.pet.breed && ` (${booking.pet.breed})`}
                  </p>
                  <p className="text-gray-600">
                    {view === 'owner' ? 'Provider' : 'Owner'}: {
                      view === 'owner' ? booking.provider?.name : booking.owner?.name
                    }
                  </p>
                  {booking.serviceType === 'BOARDING' && (
                    <p className="text-gray-600">
                      {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                    </p>
                  )}
                  {booking.serviceType === 'WALKING' && (
                    <p className="text-gray-600">
                      {formatDate(booking.walkDate)} at {booking.walkTime} ({booking.duration} min)
                    </p>
                  )}
                  {booking.totalPrice && (
                    <p className="text-gray-700 font-medium mt-2">
                      Total: ${booking.totalPrice}
                    </p>
                  )}
                </div>
                
                {booking.status === 'PENDING' && view === 'provider' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      Decline
                    </button>
                  </div>
                )}
                
                {booking.status === 'PENDING' && view === 'owner' && (
                  <button
                    onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                    className="text-red-600 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
              
              {booking.notes && (
                <p className="text-gray-500 mt-4 text-sm">
                  Notes: {booking.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
