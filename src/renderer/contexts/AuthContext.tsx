import { AuthState } from "@/types/user";
import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";

interface AuthContextType {
    auth: AuthState;
    login: (username: string, password: string) => Promise<Boolean>;
    logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
interface AuthProviderProps {
    children: ReactNode;
}
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [auth, setAuth] = useState<AuthState>({ token: null, user: null });
    const login = async (username: string, password: string) => {
        try {
            const res = await (window as any).electronAPI.loginUser({
                username,
                userPassword: password,
            });
            if (!res.status) {
                toast.error("Login failed. Please check your credentials.");
                return false;
            }
            const { token, user } = res;
            setAuth({ token, user });
            toast.success(`Welcome, ${user.name}!`);
            return true;
        } catch (error) {
            toast.error("Login failed. Please check your credentials.");
            return false;
        }
    };
    const logout = async () => {
        try {
            await (window as any).electronAPI.logoutUser(auth.token);
            setAuth({ token: null, user: null });
            toast.success("Logged out successfully");
        } catch (error) {
            throw error;
        }
    };
    const value: AuthContextType = {
        auth,
        login,
        logout
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}