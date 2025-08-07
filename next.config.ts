import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // If you are using Next.js 14.1 or later, uncomment this to suppress experimental PPR warnings if not using it.
  // experimental: {
  //   ppr: false, 
  // },
};

export default nextConfig;
