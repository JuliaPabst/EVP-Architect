/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kununu/ui', '@kununu/common'],
  
  webpack: (webpackConfig, options) => {
    const {isServer} = options;
    if (!isServer) {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
      };
    }

    return webpackConfig;
  },
};

module.exports = nextConfig;
