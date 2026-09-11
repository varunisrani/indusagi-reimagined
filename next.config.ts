import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/docs", destination: "/docs/getting-started", permanent: true },
      { source: "/cli", destination: "/cli/README", permanent: true },
      { source: "/python", destination: "/python/getting-started", permanent: true },
      { source: "/python-cli", destination: "/python-cli/getting-started", permanent: true },
      { source: "/rust", destination: "/rust/getting-started", permanent: true },
      { source: "/rust-cli", destination: "/rust-cli/getting-started", permanent: true },
    ];
  },
};

export default nextConfig;
