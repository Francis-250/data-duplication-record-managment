import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const isNeon =
  connectionString.includes("neon.tech") || connectionString.includes("neon");

const adapter = isNeon
  ? new PrismaNeon({ connectionString })
  : new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

export default prisma;
