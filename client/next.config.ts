import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: ["react-data-grid"],
  // sassOptions: {
  //   silenceDeprecations: ["legacy-js-api", "import"],
  // },
  // force restart
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
