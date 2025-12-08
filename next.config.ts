import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        "pino-pretty": false,
        lokijs: false,
        encoding: false,
      };
    }
    // Ignore worker_threads in client bundle
    config.externals.push({
      "worker_threads": "commonjs worker_threads",
    });
    return config;
  },
};

export default nextConfig;
