/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Gradual strict typing: all source files are .ts/.tsx; tighten types over time.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '10.34.129.75',
      },
    ],
  },
};

export default nextConfig;
