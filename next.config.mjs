/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Known CMS media hosts rendered via next/image (see lib/img.ts).
    remotePatterns: [
      { protocol: 'https', hostname: 'www.devya.dev' },
      { protocol: 'https', hostname: 'imagedelivery.net' },
    ],
  },
  async rewrites() {
    const upstream = process.env.API_PROXY_TARGET ?? 'https://api.devya-solutions.com';
    return [{ source: '/api/:path*', destination: `${upstream}/api/:path*` }];
  },
};
export default nextConfig;
