import { Navigate, Outlet } from "react-router-dom";
import { getToken, getUser } from "../../services/api";

const ProtectedRoute = ({ allowedRoles }) => {
    const token = getToken();
    const user = getUser();

    // Not logged in
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Check role if allowedRoles specified
    if (allowedRoles && allowedRoles.length > 0) {
        const userRoles = user.roles || [];
        const hasRole = allowedRoles.some((role) => userRoles.includes(role));

        if (!hasRole) {
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
