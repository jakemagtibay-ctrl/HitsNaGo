// Next.js configuration file for HitsNaGo
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Automatically redirects legacy or alternate URLs to their correct current pages
  async redirects() {
    return [
      {
        source: "/become-a-partner",
        destination: "/join",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
