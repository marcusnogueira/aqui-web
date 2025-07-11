'use client';

import { Navigation } from '@/components/Navigation';
import { AuthModal } from '@/components/AuthModal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AboutPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-chili-orange rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Bringing Street Vendors to the Digital Map — One Stand at a Time.
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            AQUÍ is a community-first platform that helps local vendors thrive, and helps you discover them.
          </p>
        </div>

        {/* Our Mission */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Mission</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              We're on a mission to empower local food stands, pop-up shops, and informal vendors by giving 
              them the digital tools they deserve — without the complexity or corporate noise.
            </p>
            <p>
              We believe small businesses are the soul of a city, and everyone should be able to discover and 
              support them, easily and authentically.
            </p>
          </div>
        </section>

        {/* Why We Built This */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Why We Built This</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              Too many vendors are hidden in plain sight — no websites, no delivery apps, no visibility.
            </p>
            <p>
              We built AQUÍ so that vendors can go live, set up shop, and share their offerings without needing 
              marketing budgets or storefronts.
            </p>
            <p>
              Whether it's a taco cart on the corner or a handmade crafts table at a local market — you deserve 
              to be found.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-market-cream dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-chili-orange rounded-full"></div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Vendors Go Live</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share your real-time or static location
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-market-cream dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-chili-orange rounded-full"></div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Show Your Menu</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload images, PDF menus, and daily specials
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-market-cream dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-chili-orange rounded-full"></div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Customers Explore</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find you via map or list view
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-market-cream dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-chili-orange rounded-full"></div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Community Powered</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reviews and discovery come from real people
              </p>
            </div>
          </div>
        </section>

        {/* The AQUÍ Difference */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-chili-orange to-bay-cypress rounded-lg p-8 text-center text-white">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">The AQUÍ Difference</h2>
            <p className="text-lg">
              Just you, your hustle, and your community.
            </p>
          </div>
        </section>

        {/* Join the Movement */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Join the Movement</h2>
          <div className="space-x-4">
            <button 
              onClick={() => router.push('/')}
              className="bg-chili-orange hover:bg-bay-cypress text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Explore
            </button>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="border border-chili-orange text-chili-orange hover:bg-market-cream dark:hover:bg-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Login
            </button>
          </div>
        </section>
      </div>
      
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}