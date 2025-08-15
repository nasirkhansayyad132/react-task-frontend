import axios from 'axios';

// Get the CSRF token to make secure requests
axios.get(`${import.meta.env.VITE_API_BASE_URL}/sanctum/csrf-cookie`);

const axiosClient = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
    withCredentials: true, // <-- CRUCIAL: This tells axios to send cookies
});

// We still use a token interceptor as a fallback and for initial login state
axiosClient.interceptors.request.use(config => {
    const token = localStorage.getItem('AUTH_TOKEN');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;