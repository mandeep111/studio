
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
  // @ts-ignore – 'allowedDevOrigins' is valid in runtime, just not typed yet in some Next.js versions
  allowedDevOrigins: ["*.cloudworkstations.dev",
      'https://9000-firebase-studio-1750998323126.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev',
  ],
};

export default nextConfig;
