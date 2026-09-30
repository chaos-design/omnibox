let assetPrefix = '';
let basePath = '';
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

if (isGithubActions) {
  const repo = process.env.GITHUB_REPOSITORY?.replace(/.*?\//, '');

  if (repo) {
    assetPrefix = `/${repo}/`;
    basePath = `/${repo}`;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  assetPrefix,
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    // 自托管静态资源（monaco）需要在客户端拼上 basePath，构建期内联。
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
