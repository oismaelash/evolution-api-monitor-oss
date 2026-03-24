/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pilot/shared', '@pilot/database'],
};

export default nextConfig;
