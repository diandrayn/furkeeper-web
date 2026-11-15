# FurKeeper

FurKeeper is a Next.js application backed by MySQL and Prisma.

## Requirements

- Node.js supported by the installed Next.js version
- MySQL

## Local setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env`, set `DATABASE_URL` to the MySQL database,
   and set a private, random `SESSION_SECRET` for signing login cookies.
   Configure `RESEND_API_KEY`, `EMAIL_FROM`, and `APP_URL` to enable registration
   confirmation and password reset emails.
3. Generate the Prisma Client and synchronize a development database with the
   schema:

   ```sh
   npx prisma generate
   npx prisma db push
   ```

   `prisma/schema.prisma` is the source of truth for the database structure.
   Review database changes and back up existing data before synchronizing.
   Do not run `prisma db push` against production; apply reviewed migrations
   there instead, using `npx prisma migrate deploy`.
4. Start the development server:

   ```sh
   npm run dev
   ```

## Production build

```sh
npm run build
npm start
```

The build generates Prisma Client before compiling the application. Configure
`DATABASE_URL` and `SESSION_SECRET` in the deployment environment. To enable
registration confirmation, resend, and password reset emails, configure these
server-only variables with a verified sender in Resend:

```env
RESEND_API_KEY=
EMAIL_FROM="FurKeeper <noreply@your-verified-domain.com>"
APP_URL=https://your-domain.com
```

Google sign-in is not available in the MySQL authentication implementation.
