/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@monitor/shared', '@monitor/database'],
};

export default nextConfig;
