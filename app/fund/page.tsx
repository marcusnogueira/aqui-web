import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Mail, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Support Aqui - Fund Our Mission',
  description: 'Support Aqui\'s mission to connect communities with local vendors. Get in touch about funding, partnerships, or collaboration opportunities.',
}

export default function FundPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-border">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-primary">Aqui</h1>
            </Link>
            
            <Link 
              href="/"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Support Aqui
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Help us build the future of local commerce
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Aqui is built for the community. If you're interested in supporting our mission — whether as a funder, partner, or collaborator — we'd love to hear from you.
            </p>
            
            <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Get in Touch
                </h3>
              </div>
              
              <p className="text-muted-foreground mb-4">
                Ready to support local communities and innovative technology? We'd love to discuss how we can work together.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="mailto:chris@get-aqui.com"
                  className="inline-flex items-center justify-center space-x-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>📧 chris@get-aqui.com</span>
                </a>
                
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <span>or copy:</span>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    chris@get-aqui.com
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-3">💰 Funding</h3>
            <p className="text-sm text-muted-foreground">
              Interested in investing in the future of local commerce? Let's discuss how Aqui can grow with your support.
            </p>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-3">🤝 Partnerships</h3>
            <p className="text-sm text-muted-foreground">
              Looking to partner with us? We're open to collaborations that benefit local communities and vendors.
            </p>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-3">🚀 Collaboration</h3>
            <p className="text-sm text-muted-foreground">
              Have ideas or expertise to share? We welcome collaborators who share our vision for supporting local businesses.
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/legal" className="text-muted-foreground hover:text-foreground transition-colors">
              Legal
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}