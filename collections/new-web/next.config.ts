import { resolve } from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const config: NextConfig = {
  output: 'export',
  basePath: '/imported',
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  turbopack: { root: resolve(__dirname, '../..') },
  experimental: { optimizePackageImports: ['lucide-react', 'd3', '@react-three/drei'] },
};

export default createNextIntlPlugin('./src/i18n/request.ts')(config);
