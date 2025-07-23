'use client'

import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslation } from 'react-i18next';
import AuthModal from '@/components/AuthModal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function FAQPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { t } = useTranslation('faq');

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
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {t('common:about')}
                </Link>
                <Link 
                  href="/faq" 
                  className="text-primary font-medium"
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
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">?</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* For Customers Section */}
        <section className="mb-12">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-orange-500 font-bold">👤</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground">{t('forCustomers.title')}</h2>
          </div>
          
          <div className="space-y-8">
            <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
          <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('forCustomers.findVendors.question')}
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>
                  {t('forCustomers.findVendors.answer1')}
                </p>
                <p>
                  {t('forCustomers.findVendors.answer2')}
                </p>
              </div>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
          <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('forCustomers.followVendors.question')}
              </h3>
              <p className="text-gray-700">
                {t('forCustomers.followVendors.answer')}
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
               <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('forCustomers.leaveReviews.question')}
              </h3>
              <p className="text-gray-700">
                {t('forCustomers.leaveReviews.answer')}
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
               <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('forCustomers.reportVendor.question')}
              </h3>
              <p className="text-gray-700">
                {t('forCustomers.reportVendor.answer')}
              </p>
            </div>
          </div>
        </section>

        {/* For Vendors Section */}
        <section className="mb-12">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-orange-500 font-bold">🧑‍🍳</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground">{t('forVendors.title')}</h2>
          </div>
          
          <div className="space-y-8">
            <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
               <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('forVendors.joinAsVendor.question')}
              </h3>
              <p className="text-gray-700">
                {t('forVendors.joinAsVendor.answer')}
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
               <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('forVendors.whatCanISell.question')}
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>
                  {t('forVendors.whatCanISell.answer1')}
                </p>
                <p>
                  {t('forVendors.whatCanISell.answer2')}
                </p>
              </div>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
               <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('forVendors.needLicense.question')}
              </h3>
              <p className="text-gray-700">
                {t('forVendors.needLicense.answer')}
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
               <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('forVendors.updateLocation.question')}
              </h3>
              <p className="text-gray-700">
                {t('forVendors.updateLocation.answer')}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="mb-12">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-orange-500 font-bold">📧</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground">{t('contactUs.title')}</h2>
          </div>
          
          <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
             <h3 className="text-xl font-semibold text-foreground mb-4">
              {t('contactUs.question')}
            </h3>
            <div className="text-gray-700 space-y-2">
              <p>
                {t('contactUs.generalEmail')} <a href="mailto:hello@get-aqui.com" className="text-orange-500 hover:text-orange-600 underline">hello@get-aqui.com</a>
              </p>
              <p>
                {t('contactUs.supportEmail')} <a href="mailto:support@get-aqui.com" className="text-orange-500 hover:text-orange-600 underline">support@get-aqui.com</a>
              </p>
            </div>
          </div>
        </section>

        {/* Thank You Message */}
        <div className="text-center mb-12">
          <p className="text-lg text-gray-600">
            {t('thankYou')}
          </p>
        </div>

        {/* Join the Movement */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">{t('joinMovement.title')}</h2>
          <div className="space-x-4">
            <button 
              onClick={() => router.push('/')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t('common:explore')}
            </button>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="border border-orange-500 text-orange-500 hover:bg-orange-50 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t('common:login')}
            </button>
            <button 
              onClick={() => router.push('/fund')}
              className="border border-orange-500 text-orange-500 hover:bg-orange-50 px-6 py-3 rounded-lg font-medium transition-colors"
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