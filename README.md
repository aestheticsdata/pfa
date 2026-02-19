## NextJS / TailwindCSS / MySQL / Express

### Configuration

- **ecosystem.config.js** (root): PM2 config for Nest + Express. Used in production; in local, Nest runs with `pnpm start:dev` and uses nest-api/.env.
- **nest-api/.env**: Local config for Nest (Prisma, `pnpm start:dev`). Not deployed; production uses ecosystem vars. Copy `nest-api/.env.example` to `.env`.

![main screenshot](readme-assets/pfa-screenshot-1.png)

![modal screenshot](readme-assets/pfa-screenshot-modal.png)
