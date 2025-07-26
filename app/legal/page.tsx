'use client'

import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { MapPin } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default function LegalNoticePage() {
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
              <span className="text-primary-foreground font-bold text-xl">⚖️</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Legal Notice
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Important legal information about AQUI
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: January 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none dark:prose-invert">
          <div className="bg-card rounded-lg p-8 shadow-sm border border-border">
            
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Platform Information</h2>
            <p className="text-foreground mb-4">
              AQUI is a digital marketplace platform that facilitates discovery and communication between 
              local vendors and customers. We operate as a technology platform and do not directly provide 
              goods or services listed by vendors.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Service Limitations</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">2.1 Platform Role</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>AQUI serves as an intermediary platform for vendor discovery</li>
              <li>We do not process payments or handle transactions directly</li>
              <li>All business relationships are between vendors and customers</li>
              <li>We do not guarantee the quality, safety, or legality of vendor offerings</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">2.2 Vendor Independence</h3>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>Vendors are independent businesses, not employees or agents of AQUI</li>
              <li>Vendors are responsible for their own licensing, permits, and compliance</li>
              <li>Pricing, availability, and service quality are determined by individual vendors</li>
              <li>Customer disputes should be resolved directly with vendors</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Disclaimers</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">3.1 Service Availability</h3>
            <p className="text-foreground mb-4">
              AQUI is provided "as is" and "as available." We do not guarantee uninterrupted service 
              or error-free operation. Platform availability may be affected by maintenance, updates, 
              or technical issues.
            </p>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">3.2 Content Accuracy</h3>
            <p className="text-foreground mb-4">
              While we strive to maintain accurate information, we cannot guarantee the completeness 
              or accuracy of vendor-provided content. Users should verify information directly with vendors.
            </p>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">3.3 Third-Party Services</h3>
            <p className="text-foreground mb-4">
              Our platform may integrate with third-party services (maps, authentication, etc.). 
              We are not responsible for the availability, accuracy, or functionality of these services.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Limitation of Liability</h2>
            <p className="text-foreground mb-4">
              To the maximum extent permitted by law, AQUI shall not be liable for:
            </p>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>Direct, indirect, incidental, or consequential damages</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Damages arising from vendor-customer interactions</li>
              <li>Issues related to food safety, quality, or vendor compliance</li>
              <li>Technical failures or service interruptions</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. User Responsibilities</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">5.1 Due Diligence</h3>
            <p className="text-foreground mb-4">
              Users are responsible for:
            </p>
            <ul className="list-disc list-inside text-foreground mb-4 space-y-2">
              <li>Verifying vendor credentials and licensing</li>
              <li>Assessing food safety and quality standards</li>
              <li>Understanding vendor policies and procedures</li>
              <li>Making informed decisions about purchases and services</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">5.2 Compliance</h3>
            <p className="text-foreground mb-4">
              All users must comply with applicable local, state, and federal laws when using the platform.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Intellectual Property</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">6.1 Platform Rights</h3>
            <p className="text-foreground mb-4">
              The AQUI platform, including its design, functionality, and branding, is protected by 
              intellectual property rights. Unauthorized use is prohibited.
            </p>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">6.2 User Content</h3>
            <p className="text-foreground mb-4">
              Users retain rights to their original content but grant AQUI necessary licenses to 
              operate the platform. Users must not infringe on others' intellectual property rights.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Dispute Resolution</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">7.1 Vendor-Customer Disputes</h3>
            <p className="text-foreground mb-4">
              Disputes between vendors and customers should be resolved directly between the parties. 
              AQUI may provide communication facilitation but is not obligated to mediate disputes.
            </p>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">7.2 Platform Disputes</h3>
            <p className="text-foreground mb-4">
              Disputes with AQUI should first be addressed through informal communication. 
              Formal dispute resolution procedures are outlined in our Terms of Service.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Regulatory Compliance</h2>
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">8.1 Food Safety</h3>
            <p className="text-foreground mb-4">
              AQUI does not regulate or inspect food vendors. Users should verify that vendors 
              comply with local health department requirements and food safety regulations.
            </p>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">8.2 Business Licensing</h3>
            <p className="text-foreground mb-4">
              Vendors are responsible for obtaining and maintaining appropriate business licenses, 
              permits, and insurance. AQUI does not verify vendor licensing status.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">9. Data and Privacy</h2>
            <p className="text-foreground mb-4">
              Our data collection and privacy practices are detailed in our{' '}
              <Link href="/privacy" className="text-primary hover:text-primary/80 underline">
                Privacy Policy
              </Link>
              . We are committed to protecting user privacy while providing platform functionality.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">10. Platform Modifications</h2>
            <p className="text-foreground mb-4">
              AQUI reserves the right to modify, suspend, or discontinue any aspect of the platform 
              at any time. We will provide reasonable notice of material changes when possible.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">11. Geographic Limitations</h2>
            <p className="text-foreground mb-4">
              AQUI is designed for local vendor discovery and may not be available in all geographic 
              areas. Service availability depends on vendor participation and local regulations.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">12. Contact Information</h2>
            <p className="text-foreground mb-4">
              For legal inquiries or concerns, contact us at:{' '}
              <a href="mailto:mrn@get-aqui.com" className="text-primary hover:text-primary/80 underline">
                mrn@get-aqui.com
              </a>
            </p>
            <p className="text-foreground mb-4">
              We do not provide a phone number or physical address for contact purposes.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">13. Effective Date</h2>
            <p className="text-foreground mb-4">
              This Legal Notice is effective as of January 2025 and may be updated periodically. 
              Material changes will be communicated to users through the platform.
            </p>

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
            href="/privacy" 
            className="text-primary hover:text-primary/80 underline underline-offset-2"
          >
            Privacy Policy
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