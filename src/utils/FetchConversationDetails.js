import axios from "axios";

export const fetchConversationDetails = async (
  apiBaseUrl,
  conversationId,
  userEmail,
  onError,
  setPublicKey,
  setReceiverEmail,
  setIsLoading
) => {
  try {
    setIsLoading(true);

    // Pass the logged-in user's email as `requester`
    const response = await axios.get(
      `${apiBaseUrl}/message/conversation/${conversationId}?requester=${userEmail}`
    );

    const {  receiverEmail, receiverPublicKey } = response.data;

    if (receiverEmail) setReceiverEmail(receiverEmail);
    if (receiverPublicKey) setPublicKey(receiverPublicKey);

  } catch (error) {
    console.error("Error fetching conversation details:", error);
    onError && onError("Failed to load conversation details");
  } finally {
    setIsLoading(false);
  }
};
