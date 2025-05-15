import axios from "axios";

const apiBaseUrl = "http://localhost:3000";

export const fetchCurrentUser = async (setIsLoading, setUserEmail, onError) => {
    try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${apiBaseUrl}/current-user`, {
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