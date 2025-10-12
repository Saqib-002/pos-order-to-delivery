export interface User {
  id?: string;
  username: string;
  password: string;
  role: 'admin' | 'kitchen' | 'manager' | 'staff';
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  syncAt: string;
  isDeleted?: boolean;
}
export interface AuthState {
  token: string | null;
  user: Omit<User, "password"> | null;
} 