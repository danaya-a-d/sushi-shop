import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // Временно: в Vercel Services Beta запрос /_next/image не доходит до оптимизатора Vercel и получает 404
  // от самого Next.js. Пока не выяснена причина, <Image> отдаёт исходные файлы из /public напрямую.
  images: {
    unoptimized: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
