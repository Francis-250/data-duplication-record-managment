import "dotenv/config";
import net from "net";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Ensure Node network connections prioritize IPv4 to prevent unreachable IPv6 timeouts
const origConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args: any[]) {
  if (typeof args[0] === "object" && args[0] !== null) {
    args[0].autoSelectFamily = false;
    args[0].family = 4;
  } else if (typeof args[1] === "string" && !net.isIP(args[1])) {
    const port = args[0];
    const host = args[1];
    const cb = args[2];
    return (origConnect as any).call(this, { port, host, autoSelectFamily: false, family: 4 }, cb);
  }
  return (origConnect as any).apply(this, args);
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
