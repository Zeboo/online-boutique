import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../auth/password";

config({ path: resolve(process.cwd(), ".env"), override: true });

async function resetAdmin() {
  const email = process.env.RESET_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.RESET_ADMIN_PASSWORD;

  if (!email || !password || password.length < 16) {
    throw new Error(
      "Set RESET_ADMIN_EMAIL and a RESET_ADMIN_PASSWORD of at least 16 characters in backend/.env",
    );
  }

  const prisma = new PrismaClient();
  try {
    const admin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    if (!admin) throw new Error("No administrator account exists to reset");

    const emailOwner = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (emailOwner && emailOwner.id !== admin.id) {
      throw new Error("The requested email already belongs to another account");
    }

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: admin.id } }),
      prisma.user.update({
        where: { id: admin.id },
        data: {
          email,
          passwordHash: await hashPassword(password),
          status: "ACTIVE",
        },
      }),
    ]);

    console.info(`Reset the administrator account for ${email}. Existing sessions were revoked.`);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin().catch((error: unknown) => {
  console.error("Could not reset the administrator account.", error);
  process.exitCode = 1;
});
