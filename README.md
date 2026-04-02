# pokercage

pokercage is a web app for tracking poker home game finances. Create a group for your regular game, invite your players, and let the app handle the bookkeeping — buyins, cashouts, balances, and who owes whom at the end of the night.

### Features

- **Groups** — Organize your poker crew. Invite players via shareable links and manage roles (owner, admin, member).
- **Live ledger** — Track buyins and cashouts in real time as the game plays out.
- **Automatic payouts** — When the game ends, pokercage calculates the optimal settlement so everyone knows exactly who to request money from and how much.
- **Payment info** — Players can store their Venmo, Zelle, Cash App, or PayPal handles so settling up is one tap away.
- **Shareable results** — Mark a game as public and share the link with anyone, no account required.
- **Game history** — Full event log of every buyin, cashout, and settlement for each session.

### Tech stack

Next.js (App Router), TypeScript, PostgreSQL (Neon), Prisma, Auth.js (Google OAuth), Tailwind CSS, shadcn/ui.

---

### Setup

1. Create a `.env` file with the following variables:

   | Variable | Source |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string |
   | `DIRECT_DATABASE_URL` | Neon direct (non-pooled) connection string |
   | `TEST_DATABASE_URL` | Neon branch connection string for dev |
   | `TEST_DIRECT_DATABASE_URL` | Neon branch direct connection string for dev |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `AUTH_GOOGLE_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
   | `AUTH_GOOGLE_SECRET` | Google Cloud Console |

   Set the Google OAuth redirect URI to `http://localhost:3000/api/auth/callback/google`.

2. Install dependencies and run migrations:
   ```bash
   npm install
   npm run db:migrate
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```
