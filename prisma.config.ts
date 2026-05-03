// import 'dotenv/config';
// import { defineConfig, env } from 'prisma/config';

// export default defineConfig({
//   schema: 'prisma/schema.prisma',
//   migrations: {
//     path: 'prisma/migrations',
//   },
//   datasource: {
//     url: env('DATABASE_URL'),
//   },
// });

import 'dotenv/config';
import { defineConfig } from '@prisma/config'; // Perhatikan import ini

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Gunakan process.env standar dengan fallback string kosong atau dummy
    // Ini mencegah PrismaConfigEnvError saat build di Railway
    url: process.env.DATABASE_URL || "postgresql://unused:unused@localhost:5432/unused",
  },
});