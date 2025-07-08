'use client';

import { Navigation } from '@/components/Navigation';
import { AuthModal } from '@/components/AuthModal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function FAQPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">?</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about AQUÍ
          </p>
        </div>

        {/* For Customers Section */}
        <section className="mb-12">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-orange-500 font-bold">👤</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">For Customers</h2>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Q: How do I find vendors near me?
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>
                  A: Open the app and use the interactive map or explore list to see vendors close to your current location. 
                  You'll be able to view their profiles, menus, photos, and "Live" status in real time.
                </p>
                <p>
                  To show you nearby vendors, we use your device's location—but we don't store any personally identifiable 
                  location data. Your privacy stays intact while you discover what's around you.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Q: How do I keep up with my favorite vendors?
              </h3>
              <p className="text-gray-700">
                A: Never miss a drop by tapping the heart icon on any vendor profile to follow them and get real-time 
                updates when they go "Live," change locations, or post new content.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Q: Can I leave reviews for vendors?
              </h3>
              <p className="text-gray-700">
                A: Definitely. Your reviews help others discover great local spots and give vendors valuable feedback to 
                improve and grow. It's a small way to support the community—and it goes a long way.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Q: How do I report a vendor?
              </h3>
              <p className="text-gray-700">
                A: Tap the "Report" button on the vendor's profile. Our team reviews every report to help keep AQUÍ a safe, 
                respectful space for everyone.
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
            <h2 className="text-3xl font-bold text-gray-900">For Vendors</h2>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Q: How do I join as a vendor?
              </h3>
              <p className="text-gray-700">
                A: Just tap "Join as a Vendor" in the app to set up your profile. From there, you can go live, share your 
                location, post hours, upload menus, and add photos all in real time. No red tape, no waiting.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Q: What can I sell on AQUÍ?
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>
                  A: Anything you'd normally sell in person—food, art, clothing, jewelry, handmade goods, or services. 
                  If it's part of your hustle, there's a space for it on AQUÍ.
                </p>
                <p>
                  We don't allow the sale of illegal or harmful items—like drugs, weapons, tobacco, or anything that puts 
                  the community at risk.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Q: Do I need a license to join AQUÍ?
              </h3>
              <p className="text-gray-700">
                A: Nope. AQUÍ doesn't require a business license to get started. That said, we encourage all vendors to 
                follow local laws, health rules, and safety guidelines—especially if you're serving food or offering services.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Q: How do I update my location or availability?
              </h3>
              <p className="text-gray-700">
                A: Just log into the app, tap "Update Status," and set your current location, hours, or a custom message 
                for the day. Your followers will get notified right away—so they always know when you're live.
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
            <h2 className="text-3xl font-bold text-gray-900">Contact Us</h2>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              How do I contact the AQUÍ team?
            </h3>
            <div className="text-gray-700 space-y-2">
              <p>
                You can email us at <a href="mailto:hello@get-aqui.com" className="text-orange-500 hover:text-orange-600 underline">hello@get-aqui.com</a>
              </p>
              <p>
                Have a question or need help? Reach out to <a href="mailto:support@get-aqui.com" className="text-orange-500 hover:text-orange-600 underline">support@get-aqui.com</a>
              </p>
            </div>
          </div>
        </section>

        {/* Thank You Message */}
        <div className="text-center mb-12">
          <p className="text-lg text-gray-600">
            Thank you for being part of the AQUÍ community!
          </p>
        </div>

        {/* Join the Movement */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Join the Movement</h2>
          <div className="space-x-4">
            <button 
              onClick={() => router.push('/explore')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Explore
            </button>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="border border-orange-500 text-orange-500 hover:bg-orange-50 px-6 py-3 rounded-lg font-medium transition-colors"
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