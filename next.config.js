/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build optimizations
  eslint: {
    ignoreDuringBuilds: false, // Enable eslint during builds for production
    dirs: ['app', 'components', 'lib', 'types'] // Only lint these directories
  },
  typescript: {
    ignoreBuildErrors: false, // Ensure type safety
  },
  
  // Image optimization
  images: { 
    unoptimized: false, // Enable Next.js image optimization
    domains: ['images.pexels.com', 'via.placeholder.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-avatar'],
    scrollRestoration: true,
  },
  
  // Output configuration
  outputFileTracingRoot: __dirname,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  
  // Compress responses
  compress: true,
  
  // Runtime configuration
  poweredByHeader: false,
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
};

// Bundle analyzer for performance monitoring
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
