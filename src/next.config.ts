
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "https://*.cloudworkstations.dev",
    "https://6000-firebase-studio-1750998323126.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev",
    "https://9000-firebase-studio-1750998323126.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev"
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

export default nextConfig;
