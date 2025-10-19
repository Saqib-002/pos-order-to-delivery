import { UserDatabaseOperations } from '../database/userOperations.js';
import jwt from 'jsonwebtoken';
import { User } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const sessions: { [token: string]: { userId: string; role: string; expires: number } } = {};

export async function registerUser(_: any,token:string, userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ status: boolean; data?: Omit<User, 'syncAt'>,error?:string }> {
  try {
    const result = await UserDatabaseOperations.registerUser(userData);
    return {
      status:true,
      data:result
    };
  } catch (error) {
    return {
      status:false,
      error:(error as Error).message
    }
  }
}

export async function loginUser(_: any, { username, userPassword }: { username: string; userPassword: string }): Promise<{ token: string;status:boolean; user: Omit<User, 'password'|'syncAt'> }> {
  try {
    const { token, user } = await UserDatabaseOperations.loginUser(username, userPassword);
    
    // Store session (keep existing session management)
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    sessions[token] = { 
      userId: decoded.userId, 
      role: decoded.role, 
      expires: Date.now() + 10000 
    };
    
    return { token, user,status:true };
  } catch (error) {
    return { token: '', user: {} as Omit<User, 'password'|'syncAt'>,status:false};
  }
}

export async function logoutUser(_: any, token: string): Promise<void> {
  delete sessions[token];
}

export async function getUsers(_: any, token: string): Promise<{status:boolean;error?:string;data:Omit<User, 'password'|'syncAt'>[]}> {
  if (!isAdmin(token)) {
    return {
      status: false,
      error: 'Unauthorized: Admin access required',
      data: []
    }
  }
  try {
    const res= await UserDatabaseOperations.getUsers();
    return {
      status: true,
      data: res
    }
  } catch (error) {
    return {
      status: false,
      error: 'Failed to fetch users',
      data: []
    }
  }
}

export async function updateUser(_: any, token: string, userData: Partial<User> & { id: string }): Promise<{status:boolean;error?:string;data:Omit<User,'syncAt'>}> {
  if (!isAdmin(token)) {
    return {
      status: false,
      error: 'Unauthorized: Admin access required',
      data: {} as Omit<User,'syncAt'>
    }
  }

  try {
    const result = await UserDatabaseOperations.updateUser(userData);
    return {
      status: true,
      data: result
    }
  } catch (error) {
    return {
      status: false,
      error: (error as Error).message,
      data: {} as Omit<User,'syncAt'>
    }
  }
}

export async function deleteUser(_: any, token: string, userId: string): Promise<{status:boolean;error?:string}> {
  if (!isAdmin(token)) {
    return {
      status: false,
      error: 'Unauthorized: Admin access required',
    }
  }

  try {
    await UserDatabaseOperations.deleteUser(userId);
    return { status: true };
  } catch (error) {
    return {
      status: false,
      error: 'Failed to delete user',
    }
  }
}

export function verifyToken(event:any,token: string): { userId: string; role: string } {
  try {
    const session = sessions[token];
    if (!session || session.expires < Date.now()) {
      throw new Error('Invalid or expired token');
    }
    return { userId: session.userId, role: session.role };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    if (errorMessage.includes('expired') || errorMessage.includes('invalid token')) {
      event.sender.send('token-expired');
    }
    throw error;
  }
}

function isAdmin(token: string): boolean {
  const session = sessions[token];
  return session?.role === 'admin';
}