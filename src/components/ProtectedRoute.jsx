import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();

    if (!token) {
        // user is not authenticated
        return <Navigate to="/login" />;
    }
    return children;
};

export default ProtectedRoute;