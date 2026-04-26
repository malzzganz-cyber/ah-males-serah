/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Pastikan API routes & SSR aktif (BUKAN static export)
  output: undefined,
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
