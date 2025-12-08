import 'dotenv/config';
import { defineConfig } from '@prisma/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not defined. Create server/.env and set DATABASE_URL to a valid Postgres connection string.'
  );
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});
