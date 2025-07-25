'use client';

import { Navigation } from '@/components/Navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { VendorLoginButton } from '@/components/VendorLoginButton';
import AuthModal from '@/components/AuthModal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MapPin, Menu, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function AboutPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { t } = useTranslation('about');

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
                  {t('common:about')}
                </Link>
                <Link 
                  href="/faq" 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {t('common:faq')}
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
            {t('title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Our Mission */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">{t('mission.title')}</h2>
        <div className="space-y-4 text-foreground">
            <p>
              {t('mission.paragraph1')}
            </p>
            <p>
              {t('mission.paragraph2')}
            </p>
          </div>
        </section>

        {/* Why We Built This */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">{t('whyWeBuilt.title')}</h2>
        <div className="space-y-4 text-foreground">
            <p>
              {t('whyWeBuilt.paragraph1')}
            </p>
            <p>
              {t('whyWeBuilt.paragraph2')}
            </p>
            <p>
              {t('whyWeBuilt.paragraph3')}
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8">{t('howItWorks.title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-mission-teal" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">{t('howItWorks.step1.title')}</h3>
          <p className="text-sm text-muted-foreground">
                {t('howItWorks.step1.description')}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Menu className="w-8 h-8 text-mission-teal" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">{t('howItWorks.step2.title')}</h3>
          <p className="text-sm text-muted-foreground">
                {t('howItWorks.step2.description')}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-mission-teal" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">{t('howItWorks.step3.title')}</h3>
          <p className="text-sm text-muted-foreground">
                {t('howItWorks.step3.description')}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-mission-teal" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">{t('howItWorks.step4.title')}</h3>
          <p className="text-sm text-muted-foreground">
                {t('howItWorks.step4.description')}
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
            <h2 className="text-2xl font-bold mb-4">{t('difference.title')}</h2>
            <p className="text-lg">
              {t('difference.description')}
            </p>
          </div>
        </section>

        {/* Join the Movement */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">{t('joinMovement.title')}</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="bg-chili-orange hover:bg-bay-cypress text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t('common:explore')}
            </button>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="border border-chili-orange text-chili-orange hover:bg-market-cream dark:hover:bg-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t('common:login')}
            </button>
            <VendorLoginButton className="bg-mission-teal hover:bg-mission-teal/90 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Vendor Login
            </VendorLoginButton>
            <button 
              onClick={() => router.push('/fund')}
              className="border border-chili-orange text-chili-orange hover:bg-market-cream dark:hover:bg-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t('common:supportOurMission')}
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