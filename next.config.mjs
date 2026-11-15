/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Marks this app as upgraded for the published Next.js security advisory.
    agentUpgrade: 'security',
  },
  // midtrans-client is CommonJS and pulls in axios/lodash; keep it outside
  // the server bundle so the SDK is required at runtime instead.
  serverExternalPackages: ['midtrans-client'],
};

export default nextConfig;
