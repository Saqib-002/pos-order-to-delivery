import { db } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Logger from 'electron-log';
import { User } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Store in .env
const SALT_ROUNDS = 10;

// In-memory session store
const sessions: { [token: string]: { userId: string; role: string; expires: number } } = {};

export async function registerUser(_: any, userData: Omit<User, '_id' | '_rev' | 'createdAt' | 'updatedAt'>): Promise<User> {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const user: User = {
      _id: `users:${userData.username}`,
      username: userData.username,
      password: hashedPassword,
      role: userData.role,
      name: userData.name,
      email: userData.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const response = await db.put(user);
    return { ...user, _rev: response.rev };
  } catch (error) {
    Logger.error('Error registering user:', error);
    throw new Error('Failed to register user');
  }
}

export async function loginUser(_: any, { username, userPassword }: { username: string; userPassword: string }): Promise<{ token: string; user: Omit<User, 'password'> }> {
  try {
    const user = await db.get(`users:${username}`) as User;
    const isValid = await bcrypt.compare(userPassword, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    sessions[token] = { userId: user._id, role: user.role, expires: Date.now() + 3600000 }; // 1 hour

    const { password, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  } catch (error) {
    Logger.error('Error logging in:', error);
    throw new Error('Invalid credentials');
  }
}

export async function logoutUser(_: any, token: string): Promise<void> {
  delete sessions[token];
}

export async function getUsers(_: any, token: string): Promise<Omit<User, 'password'>[]> {
  if (!isAdmin(token)) {
    throw new Error('Unauthorized: Admin access required');
  }

  try {
    const result = await db.allDocs({
      startkey: 'users:',
      endkey: 'users:\ufff0',
      include_docs: true,
    });
    return result.rows
      .map(row => row.doc as User)
      .map(({ password, ...user }) => user);
  } catch (error) {
    Logger.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function updateUser(_: any, token: string, userData: Partial<User> & { _id: string }): Promise<User> {
  if (!isAdmin(token)) {
    throw new Error('Unauthorized: Admin access required');
  }

  try {
    const existingUser = await db.get(userData._id) as User;
    const updatedUser = {
      ...existingUser,
      ...userData,
      updatedAt: new Date().toISOString(),
    };
    if (userData.password) {
      updatedUser.password = await bcrypt.hash(userData.password, SALT_ROUNDS);
    }

    const response = await db.put(updatedUser);
    return { ...updatedUser, _rev: response.rev };
  } catch (error) {
    Logger.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
}

export async function deleteUser(_: any, token: string, userId: string): Promise<void> {
  if (!isAdmin(token)) {
    throw new Error('Unauthorized: Admin access required');
  }

  try {
    const user = await db.get(userId);
    await db.remove(user);
  } catch (error) {
    Logger.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}

export function verifyToken(_: any, token: string): { userId: string; role: string } {
  try {
    const session = sessions[token];
    if (!session || session.expires < Date.now()) {
      throw new Error('Invalid or expired token');
    }
    return { userId: session.userId, role: session.role };
  } catch (error) {
    Logger.error('Error verifying token:', error);
    throw new Error('Invalid or expired token');
  }
}

function isAdmin(token: string): boolean {
  const session = sessions[token];
  return session?.role === 'admin';
}