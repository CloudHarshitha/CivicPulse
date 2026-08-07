import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the browser subagent (127.0.0.1) to access dev resources
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['127.0.0.1', 'localhost'],
  }),
};

export default nextConfig;
