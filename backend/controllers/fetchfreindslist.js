 import axios from "axios";

export const fetchConversations = async ( userEmail ,setIsLoading , setConversations , setError) => {
       const API_BASE_URL = "http://localhost:3000";
        try {
          setIsLoading(true);
          //this is for getting all the conversations of the user
          const response = await axios.get(`${API_BASE_URL}/message/conversations/${userEmail}`); 

            let conversations = response.data.conversations || [];

            conversations = conversations.sort((a, b) => {
            const aDate = a.latestMessage?.createdAt || new Date(0);
            const bDate = b.latestMessage?.createdAt || new Date(0);
            return new Date(bDate) - new Date(aDate); 
          });

          setConversations(conversations);
        } catch (error) {
          console.error("Error fetching conversations:", error);
          setError("Failed to load conversations. Please refresh the page.");
        } finally {
          setIsLoading(false);
        }    
};
  
