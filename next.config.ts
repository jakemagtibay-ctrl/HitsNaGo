import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
