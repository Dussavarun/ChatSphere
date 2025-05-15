 import axios from "axios";

export const fetchConversations = async ( userEmail ,setIsLoading , setConversations , setError) => {
       const API_BASE_URL = "http://localhost:3000";
        try {
          setIsLoading(true);
          //this is for getting all the conversations of the user
          const response = await axios.get(`${API_BASE_URL}/message/conversations/${userEmail}`); 
          setConversations(response.data.conversations || []);
        } catch (error) {
          console.error("Error fetching conversations:", error);
          setError("Failed to load conversations. Please refresh the page.");
        } finally {
          setIsLoading(false);
        }
        
};
  
