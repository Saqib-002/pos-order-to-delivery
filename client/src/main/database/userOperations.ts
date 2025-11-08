import { db } from "./index.js";
import { User } from "@/types/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// In-memory session store
const sessions: {
  [token: string]: { userId: string; role: string; expires: number };
} = {};

export class UserDatabaseOperations {
  static async registerUser(
    userData: Omit<User, "id" | "createdAt" | "updatedAt" | "syncAt">
  ): Promise<Omit<User, "syncAt" | "isDeleted">> {
    try {
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const now = new Date().toISOString();

      const user = {
        id: `users:${userData.username}`,
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
        name: userData.name,
        email: userData.email,
        modulePermissions: JSON.stringify(userData.modulePermissions || []),
        functionPermissions: JSON.stringify(userData.functionPermissions || []),
        createdAt: now,
        updatedAt: now,
      };

      await db("users").insert(user);

      const { password, ...userWithoutPassword } = user;
      return {
        id: user.id,
        username: user.username,
        password: userData.password,
        role: user.role,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      throw error;
    }
  }

  static async loginUser(
    username: string,
    userPassword: string
  ): Promise<{ token: string; user: Omit<User, "password" | "syncAt"> }> {
    try {
      const bcrypt = await import("bcrypt");
      const row = await db("users")
        .where("username", username)
        .andWhere("isDeleted", false)
        .first();
      if (!row) {
        throw new Error("Invalid credentials");
      }
      const isValid = await bcrypt.compare(userPassword, row.password);
      if (!isValid) {
        throw new Error("Invalid credentials");
      }

      const token = jwt.sign(
        { userId: row.id, role: row.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "1h" }
      );
      sessions[token] = {
        userId: row._id,
        role: row.role,
        expires: Date.now() + 3600000,
      };

      return {
        token,
        user: {
          id: row.id,
          username: row.username,
          role: row.role,
          name: row.name,
          email: row.email,
          modulePermissions: row.modulePermissions
            ? JSON.parse(row.modulePermissions)
            : [],
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
      };
    } catch (error) {
      throw error;
    }
  }
  static async logoutUser(token: string): Promise<void> {
    delete sessions[token];
  }

  static async getUsers(): Promise<Omit<User, "password" | "syncAt">[]> {
    try {
      const rows = await db("users").where("isDeleted", false).select("*");

      return rows.map((row) => ({
        id: row.id,
        username: row.username,
        role: row.role,
        name: row.name,
        email: row.email,
        modulePermissions: row.modulePermissions
          ? JSON.parse(row.modulePermissions)
          : [],
        functionPermissions: row.functionPermissions
          ? JSON.parse(row.functionPermissions)
          : [],
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } catch (error) {
      throw error;
    }
  }

  static async updateUser(
    userData: Partial<User> & { id: string }
  ): Promise<Omit<User, "syncAt">> {
    try {
      const bcrypt = await import("bcrypt");
      const now = new Date().toISOString();

      const updateData: any = {
        username: userData.username,
        role: userData.role,
        name: userData.name,
        email: userData.email,
        updatedAt: now,
      };

      if (userData.modulePermissions !== undefined) {
        updateData.modulePermissions = JSON.stringify(
          userData.modulePermissions
        );
      }

      if (userData.functionPermissions !== undefined) {
        updateData.functionPermissions = JSON.stringify(
          userData.functionPermissions
        );
      }

      if (userData.password) {
        updateData.password = await bcrypt.hash(userData.password, 10);
      }

      await db("users").where("id", userData.id).update(updateData);

      const updatedUser = await db("users").where("id", userData.id).first();

      return {
        id: updatedUser.id,
        username: updatedUser.username,
        password: "", // Don't return password
        role: updatedUser.role,
        name: updatedUser.name,
        email: updatedUser.email,
        modulePermissions: updatedUser.modulePermissions
          ? JSON.parse(updatedUser.modulePermissions)
          : [],
        functionPermissions: updatedUser.functionPermissions
          ? JSON.parse(updatedUser.functionPermissions)
          : [],
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      throw error;
    }
  }
  static verifyToken(token: string): { userId: string; role: string } {
    try {
      const session = sessions[token];
      if (!session || session.expires < Date.now()) {
        throw new Error("Invalid or expired token");
      }
      return { userId: session.userId, role: session.role };
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }
  static isAdmin(token: string): boolean {
    const session = sessions[token];
    return session?.role === "admin";
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      await db("users").where("id", userId).update({
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      throw error;
    }
  }
}
