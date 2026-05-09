/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,

  // Alias de webpack para que @frontend/ y @backend/ resuelvan correctamente
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@frontend': path.resolve(__dirname, 'frontend'),
      '@backend':  path.resolve(__dirname, 'backend'),
    };
    return config;
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
