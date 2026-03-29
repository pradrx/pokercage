# Poker Cage

A website for people to record buyins for their poker homegames. As players cash
out, record their deltas. Once everyone has their delta recorded, we then
generate a payout structure that tells you who in the game that you should
request from.

## Setup

1. Copy `.env.example` to `.env` and fill in your values:
   - **Neon PostgreSQL**: Create a database at [neon.tech](https://neon.tech) and copy the connection strings
   - **Auth Secret**: Run `openssl rand -base64 32`
   - **Google OAuth**: Create credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) with redirect URI `http://localhost:3000/api/auth/callback/google`

2. Install dependencies and set up the database:
   ```bash
   npm install
   npx prisma migrate dev
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

## Tech Stack

- Next.js (App Router) + TypeScript
- PostgreSQL (Neon) + Prisma
- Auth.js (NextAuth v5) with Google OAuth
- Tailwind CSS + shadcn/ui
