'use client';

import { useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

type LegalDocument = 'terms' | 'privacy';

export default function LegalPage() {
  const [activeDocument, setActiveDocument] = useState<LegalDocument>('terms');

  const documents = {
    terms: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: [Date]',
      content: `
# Terms of Service

**Effective Date:** [Date]
**Last Updated:** [Date]

## 1. Acceptance of Terms

By accessing or using the AQUI platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, then you may not access the Service.

## 2. Description of Service

AQUI is an online marketplace platform that connects customers with local vendors and service providers. The platform facilitates transactions between independent vendors and customers but does not directly provide goods or services.

## 3. User Accounts

### 3.1 Account Creation
- You must provide accurate, current, and complete information during registration
- You are responsible for safeguarding your account credentials
- You must notify us immediately of any unauthorized use of your account

### 3.2 Account Types
- **Customer Accounts:** For users seeking to purchase goods or services
- **Vendor Accounts:** For businesses and individuals offering goods or services
- **Admin Accounts:** For platform administration (restricted access)

## 4. Vendor Responsibilities

### 4.1 Vendor Obligations
- Provide accurate business information and service descriptions
- Maintain current availability and pricing information
- Respond promptly to customer inquiries
- Fulfill orders and provide services as advertised
- Comply with all applicable laws and regulations

### 4.2 Vendor Content
- Vendors are solely responsible for their listings, descriptions, and promotional content
- Content must be accurate, not misleading, and comply with our content guidelines
- Vendors retain ownership of their content but grant AQUI a license to display it

## 5. Customer Responsibilities

### 5.1 Customer Conduct
- Use the platform only for lawful purposes
- Provide accurate information when making purchases
- Treat vendors and other users with respect
- Pay for goods and services as agreed

### 5.2 Reviews and Feedback
- Reviews must be honest and based on actual experiences
- Prohibited: fake reviews, defamatory content, or spam

## 6. Platform Rules

### 6.1 Prohibited Activities
- Fraudulent or deceptive practices
- Harassment, abuse, or threatening behavior
- Spam or unsolicited communications
- Violation of intellectual property rights
- Circumventing platform fees or payment systems

### 6.2 Content Guidelines
- No illegal, harmful, or offensive content
- No false or misleading information
- Respect intellectual property rights
- No adult content or services

## 7. Transactions and Payments

### 7.1 Transaction Facilitation
- AQUI facilitates transactions but is not a party to agreements between vendors and customers
- Payment processing is handled through secure third-party providers
- Platform fees may apply to transactions

### 7.2 Disputes
- Disputes should first be resolved directly between vendors and customers
- AQUI may provide mediation services but is not obligated to resolve disputes
- Chargebacks and refunds are subject to vendor policies and payment processor terms

## 8. Privacy and Data

### 8.1 Data Collection
- We collect information as described in our Privacy Policy
- Location data may be collected to provide location-based services
- Usage analytics help improve platform functionality

### 8.2 Data Sharing
- Vendor contact information may be shared with customers for transaction purposes
- We do not sell personal data to third parties
- Data may be shared as required by law or to protect platform security

## 9. Intellectual Property

### 9.1 Platform Rights
- AQUI owns all rights to the platform, including software, design, and trademarks
- Users may not copy, modify, or distribute platform content without permission

### 9.2 User Content
- Users retain ownership of content they create
- By posting content, users grant AQUI a license to use, display, and distribute it

## 10. Disclaimers and Limitations

### 10.1 Service Disclaimer
- The platform is provided "as is" without warranties
- We do not guarantee the quality, safety, or legality of vendor offerings
- Users interact with vendors at their own risk

### 10.2 Limitation of Liability
- AQUI's liability is limited to the maximum extent permitted by law
- We are not liable for indirect, incidental, or consequential damages
- Total liability shall not exceed the fees paid to AQUI in the preceding 12 months

## 11. Indemnification

Users agree to indemnify and hold AQUI harmless from claims arising from:
- Use of the platform
- Violation of these Terms
- Infringement of third-party rights
- Transactions with other users

## 12. Termination

### 12.1 Account Termination
- Users may terminate their accounts at any time
- AQUI may suspend or terminate accounts for Terms violations
- Termination does not affect existing transaction obligations

### 12.2 Effect of Termination
- Access to the platform will be revoked
- User data may be retained as required by law or legitimate business purposes

## 13. Modifications

- AQUI reserves the right to modify these Terms at any time
- Users will be notified of material changes
- Continued use constitutes acceptance of modified Terms

## 14. Governing Law

These Terms are governed by the laws of [Jurisdiction], without regard to conflict of law principles.

## 15. Dispute Resolution

### 15.1 Informal Resolution
- Disputes should first be addressed through informal negotiation

### 15.2 Arbitration
- Unresolved disputes may be subject to binding arbitration
- Class action lawsuits are waived to the extent permitted by law

## 16. Severability

If any provision of these Terms is found unenforceable, the remaining provisions will remain in full force and effect.

## 17. Contact Information

For questions about these Terms, contact us at:
- Email: legal@aqui.com
- Address: [Company Address]
- Phone: [Phone Number]
      `
    },
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: [Date]',
      content: `
# Privacy Policy

**Effective Date:** [Date]
**Last Updated:** [Date]

## 1. Introduction

AQUI ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our marketplace platform.

## 2. Information We Collect

### 2.1 Personal Information
- **Account Information:** Name, email address, phone number, profile picture
- **Business Information (Vendors):** Business name, address, tax ID, banking details
- **Transaction Information:** Purchase history, payment methods, billing addresses
- **Communication Data:** Messages between users, customer service interactions

### 2.2 Automatically Collected Information
- **Device Information:** IP address, browser type, operating system, device identifiers
- **Usage Data:** Pages visited, features used, time spent on platform, click patterns
- **Location Data:** GPS coordinates, approximate location based on IP address
- **Cookies and Tracking:** Session data, preferences, analytics information

### 2.3 Information from Third Parties
- **Social Media:** Profile information when you connect social media accounts
- **Payment Processors:** Transaction verification and fraud prevention data
- **Business Verification:** Information from business verification services

## 3. How We Use Your Information

### 3.1 Platform Operations
- Create and manage user accounts
- Facilitate transactions between vendors and customers
- Process payments and prevent fraud
- Provide customer support and resolve disputes
- Maintain platform security and prevent abuse

### 3.2 Communication
- Send transaction confirmations and updates
- Notify users of platform changes or new features
- Respond to inquiries and provide customer support
- Send marketing communications (with consent)

### 3.3 Improvement and Analytics
- Analyze platform usage to improve functionality
- Develop new features and services
- Conduct research and analytics
- Personalize user experience

### 3.4 Legal and Safety
- Comply with legal obligations and regulations
- Protect against fraud, abuse, and security threats
- Enforce our Terms of Service
- Respond to legal requests and court orders

## 4. Information Sharing and Disclosure

### 4.1 Between Platform Users
- **Vendor Information:** Business details, contact information, and reviews are visible to customers
- **Customer Information:** Limited contact details may be shared with vendors for transaction purposes
- **Public Content:** Reviews, ratings, and public profile information

### 4.2 Service Providers
- **Payment Processors:** For transaction processing and fraud prevention
- **Cloud Storage:** For data hosting and backup services
- **Analytics Providers:** For platform improvement and user insights
- **Customer Support:** For providing user assistance

### 4.3 Business Transfers
- Information may be transferred in connection with mergers, acquisitions, or asset sales
- Users will be notified of any such transfers

### 4.4 Legal Requirements
- When required by law, regulation, or court order
- To protect our rights, property, or safety
- To investigate fraud or security incidents
- With user consent

## 5. Data Security

### 5.1 Security Measures
- Encryption of data in transit and at rest
- Secure authentication and access controls
- Regular security audits and monitoring
- Employee training on data protection

### 5.2 Data Breach Response
- Prompt investigation of security incidents
- Notification of affected users when required
- Cooperation with law enforcement when necessary
- Implementation of additional safeguards

## 6. Your Rights and Choices

### 6.1 Account Management
- **Access:** View and download your personal information
- **Update:** Modify your account and profile information
- **Delete:** Request deletion of your account and data
- **Portability:** Export your data in a structured format

### 6.2 Communication Preferences
- **Marketing Emails:** Opt out of promotional communications
- **Push Notifications:** Control mobile app notifications
- **SMS Messages:** Unsubscribe from text message updates

### 6.3 Privacy Controls
- **Location Sharing:** Control location data collection
- **Profile Visibility:** Manage public profile information
- **Data Processing:** Object to certain data processing activities

## 7. Cookies and Tracking Technologies

### 7.1 Types of Cookies
- **Essential Cookies:** Required for platform functionality
- **Analytics Cookies:** Help us understand platform usage
- **Preference Cookies:** Remember your settings and preferences
- **Marketing Cookies:** Deliver relevant advertisements

### 7.2 Cookie Management
- Browser settings can control cookie acceptance
- Third-party opt-out tools are available
- Some features may not work without certain cookies

## 8. International Data Transfers

- Data may be processed in countries other than your residence
- We ensure adequate protection through appropriate safeguards
- Transfers comply with applicable data protection laws

## 9. Data Retention

### 9.1 Retention Periods
- **Account Data:** Retained while account is active plus reasonable period after closure
- **Transaction Data:** Retained for legal and tax compliance requirements
- **Communication Data:** Retained for customer service and dispute resolution
- **Analytics Data:** Aggregated data may be retained indefinitely

### 9.2 Deletion Requests
- Users can request data deletion subject to legal requirements
- Some data may be retained for legitimate business purposes
- Anonymized data may be retained for analytics

## 10. Children's Privacy

- Our platform is not intended for users under 13 years of age
- We do not knowingly collect information from children under 13
- Parents can contact us to request deletion of child's information

## 11. Third-Party Links and Services

- Our platform may contain links to third-party websites
- This Privacy Policy does not apply to third-party services
- Users should review third-party privacy policies
- Vendor privacy practices may differ from ours

## 12. Regional Privacy Rights

### 12.1 California Residents (CCPA)
- Right to know what personal information is collected
- Right to delete personal information
- Right to opt out of sale of personal information
- Right to non-discrimination for exercising privacy rights

### 12.2 European Residents (GDPR)
- Lawful basis for processing personal data
- Right to access, rectify, and erase personal data
- Right to data portability and restriction of processing
- Right to object to processing and automated decision-making

### 12.3 Other Jurisdictions
- We comply with applicable local privacy laws
- Additional rights may be available based on location

## 13. Updates to This Policy

- We may update this Privacy Policy periodically
- Material changes will be communicated to users
- Continued use constitutes acceptance of updates
- Previous versions are available upon request

## 14. Contact Information

For privacy-related questions or requests, contact us at:

- **Email:** privacy@aqui.com
- **Address:** [Company Address]
- **Phone:** [Phone Number]
- **Data Protection Officer:** [DPO Contact Information]

### 14.1 Exercising Your Rights
To exercise your privacy rights:
1. Log into your account and use privacy settings
2. Contact us using the information above
3. Provide sufficient information to verify your identity
4. Specify the right you wish to exercise

## 15. Definitions

- **Personal Information:** Information that identifies or relates to an individual
- **Processing:** Any operation performed on personal data
- **Controller:** Entity that determines purposes and means of processing
- **Processor:** Entity that processes data on behalf of controller
      `
    }
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold text-gray-900 mb-6">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-semibold text-gray-800 mt-8 mb-4">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-medium text-gray-700 mt-6 mb-3">{line.substring(4)}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="text-gray-600 ml-4 mb-1">{line.substring(2)}</li>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-semibold text-gray-800 mt-4 mb-2">{line.slice(2, -2)}</p>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="text-gray-600 mb-2 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Legal Documents</h1>
            <p className="mt-2 text-gray-600">Terms of Service and Privacy Policy for AQUI</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2 sticky top-8">
              <button
                onClick={() => setActiveDocument('terms')}
                className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors ${
                  activeDocument === 'terms'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="font-medium">Terms of Service</span>
                <ChevronRightIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setActiveDocument('privacy')}
                className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors ${
                  activeDocument === 'privacy'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="font-medium">Privacy Policy</span>
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 mt-8 lg:mt-0">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {documents[activeDocument].title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {documents[activeDocument].lastUpdated}
                </p>
              </div>
              <div className="px-6 py-6">
                <div className="prose prose-gray max-w-none">
                  {formatContent(documents[activeDocument].content)}
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> These are template documents and should be reviewed by legal counsel before implementation. 
                Specific jurisdictional requirements may apply.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}