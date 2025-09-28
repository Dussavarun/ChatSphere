import axios from "axios";

const sendMessage = async ({
  message,
  setMessage,
  file,
  setFile,
  userEmail,
  receiverEmail,
  setIsSending,
  setMessages,
  onError,
  apiBaseUrl
}) => {
  // if (message.trim() === "" && !file) return;

  if (!receiverEmail) {
    onError && onError("Recipient not found. Please try again later.");
    return;
  }

  const messageText = String(message).trim();
  setMessage("");

  const tempId = `temp-${Date.now()}`;
  
  try {
    setIsSending(true);

    const tempMessage = {
      id: tempId,
      text: messageText,
      fileUrl: file ? URL.createObjectURL(file) : null,
      fileName: file ? file.name : null,
      senderId: userEmail,
      createdAt: new Date().toISOString(),
      pending: true
    };

    setMessages(prev => [...prev, tempMessage]);

    const formData = new FormData();
    formData.append("senderEmail", userEmail);
    formData.append("receiverEmail", receiverEmail);
    formData.append("text", messageText);

    if (file) {
      formData.append("file", file);
    }

    const response = await axios.post(`${apiBaseUrl}/message/send`, formData);

    setMessages(prev =>
      prev.map(msg =>
        msg.id === tempId
          ? {
              ...msg,
              id: response.data.data._id,
              pending: false,
              fileUrl: response.data.data.fileUrl,
              fileName: response.data.data.fileName
            }
          : msg
      )
    );

    setFile(null);
  } catch (error) {
    console.error("Error sending message:", error);
    onError && onError("Failed to send message. Please try again.");
    setMessages(prev => prev.filter(msg => msg.id !== tempId));
    setMessage(messageText);
  } finally {
    setIsSending(false);
  }
};

export default sendMessage;
