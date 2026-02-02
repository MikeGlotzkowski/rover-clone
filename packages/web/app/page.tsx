import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Find the Perfect Care for Your Pet
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Connect with trusted pet sitters and dog walkers in your neighborhood
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/search?service=BOARDING"
            className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700"
          >
            Find Boarding
          </Link>
          <Link 
            href="/search?service=WALKING"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700"
          >
            Find Dog Walkers
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-4xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold mb-2">Boarding</h3>
          <p className="text-gray-600">
            Your pet stays at a sitter's home while you're away
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-4xl mb-4">🚶</div>
          <h3 className="text-xl font-semibold mb-2">Dog Walking</h3>
          <p className="text-gray-600">
            Daily walks to keep your dog happy and healthy
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-4xl mb-4">⭐</div>
          <h3 className="text-xl font-semibold mb-2">Trusted Sitters</h3>
          <p className="text-gray-600">
            Read reviews from other pet owners in your area
          </p>
        </div>
      </div>
    </div>
  );
}
