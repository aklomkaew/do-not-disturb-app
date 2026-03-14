# Neon Setup: org-patient-firefly-94472340 / withered-shadow-85620988

Quick steps to connect your app to your Neon project.

## 1. Get your connection string

1. Go to [console.neon.tech](https://console.neon.tech)
2. Open org **org-patient-firefly-94472340** → project **withered-shadow-85620988**
3. Click **Connection details** (or **Connect**)
4. **Enable "Connection pooling"** (recommended for production and scaling)
5. Copy the connection string — it looks like:
   ```
   postgresql://[user]:[password]@ep-[branch]-[id]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require
   ```

## 2. Set `DATABASE_URL` in server/.env

Create or edit `server/.env`:

```env
DATABASE_URL="your-neon-pooled-connection-string"
```

## 3. Run migrations

```bash
cd server
npm run prisma:generate
npx prisma migrate deploy
```

## 4. (Optional) Verify connection

```bash
npx prisma studio
```

Opens Prisma Studio at http://localhost:5555 to browse your database.

---

**Note:** Use the **pooled** connection string (host contains `-pooler`) for the API server. Use the **direct** connection string only when running migrations if you hit pooler limits (Prisma 7+ typically works with pooled for migrations).
