/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["shared", "db", "templates", "storage", "messaging"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;
