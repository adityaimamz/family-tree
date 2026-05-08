import "dotenv/config";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured. Add it to the environment before starting the backend.");
}

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({ adapter });
