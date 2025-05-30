import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const fetchCurrentUser = async (setIsLoading, setUserEmail, onError) => {
    try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/current-user`, {
            withCredentials: true,
            headers: {
                "Authorization": token ? `Bearer ${token}` : undefined
            }
        });
        setUserEmail(response.data.email);
    } catch (error) {
        console.error("Failed to get current user:", error);
        onError && onError("Failed to authenticate user");
    } finally {
        setIsLoading(false);
    }
};