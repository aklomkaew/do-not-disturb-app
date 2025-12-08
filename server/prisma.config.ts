import 'dotenv/config';
import { defineConfig } from '@prisma/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not defined. Create server/.env (see server/.env.example) before running Prisma commands.'
  );
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
});
