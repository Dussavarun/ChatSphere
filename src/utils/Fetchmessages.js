import axios from "axios";

export const fetchMessages = async (apiBaseUrl , conversationId , setMessages , onError , isMounted , setIsLoading) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${apiBaseUrl}/message/${conversationId}`);
      if (isMounted) {
        setMessages(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (isMounted) {
        onError && onError("Failed to load messages");
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };
