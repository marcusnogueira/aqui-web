'use client'

import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { MapPin } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default function TermsOfServicePage() {
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
              <span className="text-primary-foreground font-bold text-xl">📋</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using AQUI
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: January 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none dark:prose-invert">
          <div className="bg-card rounded-lg p-8 shadow-sm border border-border">
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-foreground mb-4">
              By accessing or using the AQUI platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
              If you disagree with any part of these terms, then you may not access the Service.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Description of Service</h2>
            <p className="text-foreground mb-4">
              AQUI is an online marketplace platform that connects customers with local vendors and service providers. 
              The platform facilitates discovery and communication between independent vendors and customers but does not 
              directly provide goods or services.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">3.1 Account Creation</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>You must provide accurate, current, and complete information during registration</li>
              <li>You are responsible for safeguarding your account credentials</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">3.2 Account Types</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li><strong>Customer Accounts:</strong> For users seeking to discover local vendors</li>
              <li><strong>Vendor Accounts:</strong> For businesses and individuals offering goods or services</li>
              <li><strong>Admin Accounts:</strong> For platform administration (restricted access)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Vendor Responsibilities</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">4.1 Vendor Obligations</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>Provide accurate business information and service descriptions</li>
              <li>Maintain current availability and location information</li>
              <li>Respond promptly to customer inquiries when possible</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Maintain appropriate licenses and permits for your business</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">4.2 Vendor Content</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>Vendors are solely responsible for their listings, descriptions, and promotional content</li>
              <li>Content must be accurate, not misleading, and comply with our content guidelines</li>
              <li>Vendors retain ownership of their content but grant AQUI a license to display it</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Customer Responsibilities</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">5.1 Customer Conduct</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>Use the platform only for lawful purposes</li>
              <li>Provide accurate information when interacting with vendors</li>
              <li>Treat vendors and other users with respect</li>
              <li>Follow vendor-specific terms for purchases and services</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">5.2 Reviews and Feedback</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>Reviews must be honest and based on actual experiences</li>
              <li>Prohibited: fake reviews, defamatory content, or spam</li>
              <li>We reserve the right to remove inappropriate reviews</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Platform Rules</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">6.1 Prohibited Activities</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>Fraudulent or deceptive practices</li>
              <li>Harassment, abuse, or threatening behavior</li>
              <li>Spam or unsolicited communications</li>
              <li>Violation of intellectual property rights</li>
              <li>Attempting to circumvent platform security measures</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">6.2 Content Guidelines</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>No illegal, harmful, or offensive content</li>
              <li>No false or misleading information</li>
              <li>Respect intellectual property rights</li>
              <li>No adult content or inappropriate services</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Transactions and Interactions</h2>
            <p className="text-foreground mb-4">
              AQUI facilitates discovery and communication between vendors and customers but is not a party to 
              agreements between them. All transactions, payments, and service arrangements are directly between 
              vendors and customers. AQUI does not process payments or guarantee the quality of goods or services.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Privacy and Data</h2>
            <p className="text-foreground mb-4">
              We collect and use information as described in our{' '}
              <Link href="/privacy" className="text-primary hover:text-primary/80 underline">
                Privacy Policy
              </Link>
              . Location data may be collected to provide location-based services, and usage analytics help 
              improve platform functionality.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">9. Intellectual Property</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">9.1 Platform Rights</h3>
            <p className="text-foreground mb-4">
              AQUI owns all rights to the platform, including software, design, and trademarks. 
              Users may not copy, modify, or distribute platform content without permission.
            </p>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">9.2 User Content</h3>
            <p className="text-foreground mb-4">
              Users retain ownership of content they create. By posting content, users grant AQUI a 
              license to use, display, and distribute it on the platform.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">10. Disclaimers and Limitations</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">10.1 Service Disclaimer</h3>
            <p className="text-foreground mb-4">
              The platform is provided "as is" without warranties. We do not guarantee the quality, 
              safety, or legality of vendor offerings. Users interact with vendors at their own risk.
            </p>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">10.2 Limitation of Liability</h3>
            <p className="text-foreground mb-4">
              AQUI's liability is limited to the maximum extent permitted by law. We are not liable 
              for indirect, incidental, or consequential damages arising from use of the platform.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">11. Account Termination</h2>
            <p className="text-foreground mb-4">
              Users may terminate their accounts at any time. AQUI may suspend or terminate accounts 
              for Terms violations. Termination does not affect existing obligations between users.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">12. Modifications</h2>
            <p className="text-foreground mb-4">
              AQUI reserves the right to modify these Terms at any time. Users will be notified of 
              material changes. Continued use constitutes acceptance of modified Terms.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">13. Governing Law</h2>
            <p className="text-foreground mb-4">
              These Terms are governed by applicable law. Any disputes will be resolved through 
              appropriate legal channels.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">14. Contact Information</h2>
            <p className="text-foreground mb-4">
              For questions about these Terms, contact us at:{' '}
              <a href="mailto:mrn@get-aqui.com" className="text-primary hover:text-primary/80 underline">
                mrn@get-aqui.com
              </a>
            </p>
            <p className="text-foreground mb-4">
              We do not provide a phone number or physical address for contact purposes.
            </p>

          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm">
          <Link 
            href="/privacy" 
            className="text-primary hover:text-primary/80 underline underline-offset-2"
          >
            Privacy Policy
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