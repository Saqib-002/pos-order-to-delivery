import { DatabaseOperations } from '../database/operations.js';
import { syncManager } from '../database/sync.js';
import jwt from 'jsonwebtoken';
import Logger from 'electron-log';
import { User } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// In-memory session store (keep existing functionality)
const sessions: { [token: string]: { userId: string; role: string; expires: number } } = {};

export async function registerUser(_: any, userData: Omit<User, '_id' | '_rev' | 'createdAt' | 'updatedAt'>): Promise<User> {
  try {
    const result = await DatabaseOperations.registerUser(userData);
    
    // Trigger sync after registration
    setTimeout(() => syncManager.syncWithRemote(), 100);
    
    return result;
  } catch (error) {
    Logger.error('Error registering user:', error);
    throw new Error('Failed to register user');
  }
}

export async function loginUser(_: any, { username, userPassword }: { username: string; userPassword: string }): Promise<{ token: string; user: Omit<User, 'password'> }> {
  try {
    const { token, user } = await DatabaseOperations.loginUser(username, userPassword);
    
    // Store session (keep existing session management)
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    sessions[token] = { 
      userId: decoded.userId, 
      role: decoded.role, 
      expires: Date.now() + 3600000 
    };
    
    return { token, user };
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
    return await DatabaseOperations.getUsers();
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
    const result = await DatabaseOperations.updateUser(userData);
    
    // Trigger sync after update
    setTimeout(() => syncManager.syncWithRemote(), 100);
    
    return result;
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
    await DatabaseOperations.deleteUser(userId);
    
    // Trigger sync after deletion
    setTimeout(() => syncManager.syncWithRemote(), 100);
    
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