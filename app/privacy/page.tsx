'use client'

import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { MapPin } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default function PrivacyPolicyPage() {
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
                  About
                </Link>
                <Link 
                  href="/faq" 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  FAQ
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
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">🔒</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            How we collect, use, and protect your information
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: January 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none dark:prose-invert">
          <div className="bg-card rounded-lg p-8 shadow-sm border border-border">
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Introduction</h2>
            <p className="text-foreground mb-4">
              AQUI ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
              our marketplace platform.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">2.1 Personal Information</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, profile picture</li>
              <li><strong>Business Information (Vendors):</strong> Business name, description, contact details</li>
              <li><strong>Communication Data:</strong> Messages between users, customer service interactions</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
              <li><strong>Location Data:</strong> GPS coordinates when you choose to share location</li>
              <li><strong>Cookies and Tracking:</strong> Session data, preferences, analytics information</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">2.3 Information from Third Parties</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li><strong>Social Media:</strong> Profile information when you connect social media accounts</li>
              <li><strong>Authentication Providers:</strong> Google, Apple sign-in information</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. How We Use Your Information</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">3.1 Platform Operations</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>Create and manage user accounts</li>
              <li>Facilitate discovery of local vendors</li>
              <li>Enable communication between vendors and customers</li>
              <li>Provide customer support and resolve issues</li>
              <li>Maintain platform security and prevent abuse</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">3.2 Communication</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>Send platform updates and notifications</li>
              <li>Respond to inquiries and provide customer support</li>
              <li>Send important service announcements</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">3.3 Improvement and Analytics</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>Analyze platform usage to improve functionality</li>
              <li>Develop new features and services</li>
              <li>Conduct research and analytics</li>
              <li>Personalize user experience</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Information Sharing and Disclosure</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">4.1 Between Platform Users</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li><strong>Vendor Information:</strong> Business details and contact information are visible to customers</li>
              <li><strong>Public Content:</strong> Reviews, ratings, and public profile information</li>
              <li><strong>Limited Sharing:</strong> We do not share personal customer information with vendors without consent</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">4.2 Service Providers</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li><strong>Cloud Storage:</strong> For data hosting and backup services</li>
              <li><strong>Analytics Providers:</strong> For platform improvement and user insights</li>
              <li><strong>Authentication Services:</strong> Google, Apple for sign-in functionality</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">4.3 Legal Requirements</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>When required by law, regulation, or court order</li>
              <li>To protect our rights, property, or safety</li>
              <li>To investigate fraud or security incidents</li>
              <li>With user consent</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Data Security</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">5.1 Security Measures</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security monitoring</li>
              <li>Employee training on data protection</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">5.2 Data Breach Response</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>Prompt investigation of security incidents</li>
              <li>Notification of affected users when required</li>
              <li>Implementation of additional safeguards</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Your Rights and Choices</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">6.1 Account Management</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li><strong>Access:</strong> View your personal information</li>
              <li><strong>Update:</strong> Modify your account and profile information</li>
              <li><strong>Delete:</strong> Request deletion of your account and data</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">6.2 Privacy Controls</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li><strong>Location Sharing:</strong> Control location data collection</li>
              <li><strong>Profile Visibility:</strong> Manage public profile information</li>
              <li><strong>Communication Preferences:</strong> Control notifications and updates</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Cookies and Tracking Technologies</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">7.1 Types of Cookies</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
              <li><strong>Analytics Cookies:</strong> Help us understand platform usage</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">7.2 Cookie Management</h3>
            <p className="text-foreground mb-4">
              Browser settings can control cookie acceptance. Some features may not work without certain cookies.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Data Retention</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">8.1 Retention Periods</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li><strong>Account Data:</strong> Retained while account is active plus reasonable period after closure</li>
              <li><strong>Communication Data:</strong> Retained for customer service and dispute resolution</li>
              <li><strong>Analytics Data:</strong> Aggregated data may be retained indefinitely</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">8.2 Deletion Requests</h3>
            <p className="text-foreground mb-4">
              Users can request data deletion subject to legal requirements. Some data may be retained 
              for legitimate business purposes. Anonymized data may be retained for analytics.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">9. Children's Privacy</h2>
            <p className="text-foreground mb-4">
              Our platform is not intended for users under 13 years of age. We do not knowingly collect 
              information from children under 13. Parents can contact us to request deletion of child's information.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">10. Third-Party Links and Services</h2>
            <p className="text-foreground mb-4">
              Our platform may contain links to third-party websites. This Privacy Policy does not apply 
              to third-party services. Users should review third-party privacy policies.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">11. International Data Transfers</h2>
            <p className="text-foreground mb-4">
              Data may be processed in countries other than your residence. We ensure adequate protection 
              through appropriate safeguards and comply with applicable data protection laws.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">12. Updates to This Policy</h2>
            <p className="text-foreground mb-4">
              We may update this Privacy Policy periodically. Material changes will be communicated to users. 
              Continued use constitutes acceptance of updates.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">13. Contact Information</h2>
            <p className="text-foreground mb-4">
              For privacy-related questions or requests, contact us at:{' '}
              <a href="mailto:mrn@get-aqui.com" className="text-primary hover:text-primary/80 underline">
                mrn@get-aqui.com
              </a>
            </p>
            <p className="text-foreground mb-4">
              We do not provide a phone number or physical address for contact purposes.
            </p>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">13.1 Exercising Your Rights</h3>
            <p className="text-foreground mb-4">
              To exercise your privacy rights:
            </p>
            <ol className="list-decimal list-inside text-foreground mb-4 space-y-2">
              <li>Contact us using the email address above</li>
              <li>Provide sufficient information to verify your identity</li>
              <li>Specify the right you wish to exercise</li>
              <li>We will respond within a reasonable timeframe</li>
            </ol>

          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm">
          <Link 
            href="/terms" 
            className="text-primary hover:text-primary/80 underline underline-offset-2"
          >
            Terms of Service
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link 
            href="/legal" 
            className="text-primary hover:text-primary/80 underline underline-offset-2"
          >
            Legal Notice
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link 
            href="/" 
            className="text-primary hover:text-primary/80 underline underline-offset-2"
          >
            Back to AQUI
          </Link>
        </div>
      </div>
    </div>
  )
}