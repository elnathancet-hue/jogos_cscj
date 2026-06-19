/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint roda no editor/CI; não bloqueia o build de deploy.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
