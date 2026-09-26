import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${process.env.API_ORIGIN || 'http://127.0.0.1:4000'}/api/:path*` },
      { source: '/socket.io/:path*', destination: `${process.env.API_ORIGIN || 'http://127.0.0.1:4000'}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;
