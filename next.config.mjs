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
  experimental: {
    serverComponentsExternalPackages: ['json-schema-to-typescript'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST,GET,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' }
        ]
      }
    ]
  },
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
