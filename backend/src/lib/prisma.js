/**
 * prisma.js
 *
 * Singleton PrismaClient for Prisma v5.
 * Client is generated into node_modules/@prisma/client (standard location).
 * Node.js module caching ensures only one connection pool is created.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export default prisma;
