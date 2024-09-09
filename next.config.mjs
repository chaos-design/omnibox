/** @type {import('next').NextConfig} */

let assetPrefix = '';
let basePath = '';
const isGithubActions = process.env.GITHUB_ACTIONS || false;

if (isGithubActions) {
  const repo = process.env.GITHUB_REPOSITORY.replace(/.*?\//, '');

  assetPrefix = `/${repo}/`;
  basePath = `/${repo}`;
}

const nextConfig = {
  basePath,
  assetPrefix,
  output: 'export',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rain120.github.io',
      },
    ],
  },
  webpack(config, { isServer }) {
    config.resolve.fallback = { fs: false };

    return config;
  },
};

export default nextConfig;
