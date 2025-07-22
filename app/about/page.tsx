'use client';

import { Navigation } from '@/components/Navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import AuthModal from '@/components/AuthModal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MapPin, Menu, Search, Users } from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function AboutPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-border">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-primary">Aqui</h1>
              </Link>
              <LanguageSwitcher />
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/about" 
                  className="text-primary font-medium"
                >
                  About
                </Link>
                <Link 
                  href="/faq" 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  FAQ
                </Link>
                <Link 
                  href="/fund" 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  Fund
                </Link>
              </nav>
              
              {/* Theme Toggle and Auth Section */}
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <Navigation />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-chili-orange rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Bringing Street Vendors to the Digital Map — One Stand at a Time.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Aqui is a community-first platform that helps local vendors thrive, and helps you discover them.
          </p>
        </div>

        {/* Our Mission */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
        <div className="space-y-4 text-foreground">
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
          <h2 className="text-3xl font-bold text-foreground mb-6">Why We Built This</h2>
        <div className="space-y-4 text-foreground">
            <p>
              Too many vendors are hidden in plain sight — no websites, no delivery apps, no visibility.
            </p>
            <p>
              We built Aqui so that vendors can go live, set up shop, and share their offerings without needing 
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
          <h2 className="text-3xl font-bold text-foreground mb-8">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-mission-teal" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Vendors Go Live</h3>
          <p className="text-sm text-muted-foreground">
                Share your real-time or static location
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Menu className="w-8 h-8 text-mission-teal" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Show Your Menu</h3>
          <p className="text-sm text-muted-foreground">
                Upload images, PDF menus, and daily specials
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-mission-teal" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Customers Explore</h3>
          <p className="text-sm text-muted-foreground">
                Find you via map or list view
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-mission-teal" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Community Powered</h3>
          <p className="text-sm text-muted-foreground">
                Reviews and discovery come from real people
              </p>
            </div>
          </div>
        </section>

        {/* The Aqui Difference */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-chili-orange to-bay-cypress rounded-lg p-8 text-center text-white">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-background bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">The Aqui Difference</h2>
            <p className="text-lg">
              Just you, your hustle, and your community.
            </p>
          </div>
        </section>

        {/* Join the Movement */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">Join the Movement</h2>
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
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}