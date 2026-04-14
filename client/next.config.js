/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'plus.unsplash.com' },
            { protocol: 'https', hostname: 'assets.mixkit.co' },
            { protocol: 'https', hostname: 'images.pexels.com' },
            { protocol: 'https', hostname: 'i.pravatar.cc' },
        ],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreDuringBuilds: true,
    },
    trailingSlash: false,
}

module.exports = nextConfig
