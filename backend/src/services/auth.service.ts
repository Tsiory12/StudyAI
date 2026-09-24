import { prisma } from "../config/database";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { AppError } from "../middleware/error.middleware";

export class AuthService {
  async register(input: { name: string; email: string; password: string }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new AppError("An account with this email already exists", 409);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash },
    });

    const token = signToken({ id: user.id, name: user.name, email: user.email });
    return { user: this.toSafeUser(user), token };
  }

  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = signToken({ id: user.id, name: user.name, email: user.email });
    return { user: this.toSafeUser(user), token };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return this.toSafeUser(user);
  }

  async updateProfile(userId: string, input: { name?: string; email?: string }) {
    if (input.email) {
      const existing = await prisma.user.findFirst({
        where: { email: input.email, id: { not: userId } },
      });
      if (existing) {
        throw new AppError("An account with this email already exists", 409);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
    });
    return this.toSafeUser(user);
  }

  async changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const valid = await comparePassword(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError("Current password is incorrect", 401);
    }

    const passwordHash = await hashPassword(input.newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: "Password updated successfully" };
  }

  toSafeUser(user: { id: string; name: string; email: string; createdAt: Date; updatedAt: Date }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const authService = new AuthService();
