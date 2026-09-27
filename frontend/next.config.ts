import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendOrigin = (
      process.env.API_ORIGIN ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.BACKEND_URL ||
      "http://127.0.0.1:4000"
    ).replace(/\/+$/, "");

    return [
      { source: "/api/:path*", destination: `${backendOrigin}/api/:path*` },
      { source: "/socket.io/:path*", destination: `${backendOrigin}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;
