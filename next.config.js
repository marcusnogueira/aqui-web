/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ndveatnmdajpohumojqb.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  // Environment variables are automatically loaded from .env file
  // PWA Configuration
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;