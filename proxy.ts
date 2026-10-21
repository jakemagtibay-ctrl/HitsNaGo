// Clerk authentication middleware that checks user login sessions on every request
import { clerkMiddleware } from "@clerk/nextjs/server"

// Activates Clerk authentication protection across the application
export default clerkMiddleware()

// Specifies which URL routes the authentication middleware should run on
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}

