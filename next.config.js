/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // The allowedDevOrigins is an experimental feature and requires the protocol.
  // We've consolidated the valid URLs here to allow requests from the Studio preview environments.
  allowedDevOrigins: [
    'https://*.cloudworkstations.dev',
    'https://*.prob2profit.com',
    '9000-firebase-studio-1750998323126.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev',
    '6000-firebase-studio-1750998323126.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev'
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
