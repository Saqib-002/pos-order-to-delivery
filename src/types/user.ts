export interface User {
  _id: string;
  _rev?: string;
  username: string;
  password: string;
  role: 'admin' | 'kitchen' | 'delivery' | 'staff';
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}
export interface AuthState {
  token: string | null;
  user: Omit<User, "password"> | null;
}