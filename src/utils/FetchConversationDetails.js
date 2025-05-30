import axios from "axios";

export const fetchConversationDetails = async (apiBaseUrl , conversationId ,userEmail, onError , setReceiverEmail , setIsLoading) => {
      try {
        setIsLoading(true);
        // it responds with the full details of a converstion room 
        const response = await axios.get(`${apiBaseUrl}/message/conversation/${conversationId}`);
   

        // the response contains the convo room id with the participants with emails then the receiver email is set to the other person who is not the user
        const otherUser = response.data.participants.find(
          participant => participant.email !== userEmail
        );
        if (otherUser) {
          setReceiverEmail(otherUser.email);
        }
      } catch (error) {
        console.error("Error fetching conversation details:", error);
        onError && onError("Failed to load conversation details");
      } finally {
        setIsLoading(false);
      }
};

   