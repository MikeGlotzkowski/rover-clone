'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { providersApi } from '@/lib/api';

interface Provider {
  id: string;
  userId: string;
  bio: string;
  servicesOffered: string;
  dailyRate: number | null;
  hourlyRate: number | null;
  user: {
    id: string;
    name: string;
    location: string;
  };
  avgRating?: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [service, setService] = useState(searchParams.get('service') || '');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const data = await providersApi.search({ location, service });
      setProviders(data);
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProviders();
  };

  const getServices = (servicesJson: string) => {
    try {
      return JSON.parse(servicesJson);
    } catch {
      return [];
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Find Pet Care</h1>
      
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl shadow-sm mb-8 flex gap-4">
        <input
          type="text"
          placeholder="Location (e.g., Brooklyn, NY)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        />
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        >
          <option value="">All Services</option>
          <option value="BOARDING">Boarding</option>
          <option value="WALKING">Dog Walking</option>
        </select>
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : providers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No providers found. Try adjusting your search.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <Link
              key={provider.id}
              href={`/providers/${provider.userId}`}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                  🧑
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{provider.user.name}</h3>
                  <p className="text-gray-500 text-sm">{provider.user.location}</p>
                  {provider.avgRating && (
                    <div className="text-yellow-500">
                      {'⭐'.repeat(Math.round(provider.avgRating))} {provider.avgRating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 mt-4 line-clamp-2">{provider.bio}</p>
              
              <div className="flex gap-2 mt-4">
                {getServices(provider.servicesOffered).map((svc: string) => (
                  <span
                    key={svc}
                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                  >
                    {svc === 'BOARDING' ? '🏠 Boarding' : '🚶 Walking'}
                  </span>
                ))}
              </div>
              
              <div className="mt-4 text-gray-700">
                {provider.dailyRate && (
                  <span className="mr-4">${provider.dailyRate}/night</span>
                )}
                {provider.hourlyRate && (
                  <span>${provider.hourlyRate}/hour</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
