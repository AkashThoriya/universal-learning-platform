/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['images.pexels.com', 'via.placeholder.com']
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts']
  }
};

module.exports = nextConfig;
