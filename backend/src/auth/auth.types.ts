import type { UserRole } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
  }
}
