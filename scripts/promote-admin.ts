/**
 * Promote an existing AppUser to platform_admin by email.
 *
 * Usage:
 *   npx tsx scripts/promote-admin.ts <email>
 *
 * Example:
 *   npx tsx scripts/promote-admin.ts adityaimam8@gmail.com
 */
import "dotenv/config";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("Usage: npx tsx scripts/promote-admin.ts <email>");
    console.error("Example: npx tsx scripts/promote-admin.ts adityaimam8@gmail.com");
    process.exit(1);
  }

  const user = await prisma.appUser.findUnique({ where: { email } });

  if (!user) {
    console.error(`No AppUser found with email "${email}".`);
    console.error("");
    console.error("Note: AppUser is created automatically when a user first signs in and accesses /app.");
    console.error("The user must sign in at least once before they can be promoted.");
    console.error("");

    const allUsers = await prisma.appUser.findMany({
      select: { email: true, name: true, platformRole: true },
      orderBy: { createdAt: "desc" },
    });

    if (allUsers.length) {
      console.error("Existing AppUsers:");
      for (const u of allUsers) {
        console.error(`  - ${u.email} (${u.name ?? "no name"}) [${u.platformRole}]`);
      }
    } else {
      console.error("No AppUsers exist yet. Have someone sign in first.");
    }

    process.exit(1);
  }

  if (user.platformRole === "platform_admin") {
    console.log(`"${email}" is already a platform_admin.`);
    process.exit(0);
  }

  await prisma.appUser.update({
    where: { id: user.id },
    data: { platformRole: "platform_admin" },
  });

  console.log(`✅ "${email}" has been promoted to platform_admin.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
