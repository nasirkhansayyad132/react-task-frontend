import { createContext, useContext, useState } from 'react';
import axiosClient from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('USER')) || null);
    const [token, setToken] = useState(localStorage.getItem('AUTH_TOKEN') || null);

    const login = async (email, password) => {
        const response = await axiosClient.post('/login', { email, password });
        const { user, token } = response.data;
        localStorage.setItem('AUTH_TOKEN', token);
        localStorage.setItem('USER', JSON.stringify(user));
        setUser(user);
        setToken(token);
    };

    const register = async (name, email, password, password_confirmation) => {
        await axiosClient.post('/register', { name, email, password, password_confirmation });
    };

    const logout = async () => {
        try {
            await axiosClient.post('/logout');
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            localStorage.removeItem('AUTH_TOKEN');
            localStorage.removeItem('USER');
            setUser(null);
            setToken(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);