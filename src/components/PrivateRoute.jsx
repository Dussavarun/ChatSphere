import axios from "axios";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ element }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    
    useEffect(() => {
        axios.get("http://localhost:3000/authenticate", { withCredentials: true })
            .then((res) => {
                setIsAuthenticated(res.data.authenticated);
            })
            .catch((err) => {
                console.error("Authentication failed:", err);
                setIsAuthenticated(false);
            });
    }, []);
    
    if (isAuthenticated === null) return <p>Loading...</p>;
    return isAuthenticated ? element : <Navigate to="/login" />;
};

export default PrivateRoute;