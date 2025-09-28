export const handleNewMessage = async (data, setMessages) => {
  console.log("Received new message data:", data);

  try {
    // Create the new message object with encrypted text
    // The ChatWindow component will handle decryption
    const newMessage = {
      id: data.id || Date.now(),
      text: data.message, // Keep the encrypted message here
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      senderId: data.senderEmail,
      createdAt: data.createdAt || new Date().toISOString(),
    };

    // Add to the encrypted messages array
    // ChatWindow will decrypt these automatically
    setMessages((prev) => {
      // Check if message already exists to avoid duplicates
      const exists = prev.some(msg => msg.id === newMessage.id);
      if (exists) {
        return prev;
      }
      return [...prev, newMessage];
    });
    
  } catch (err) {
    console.error("Failed to handle new message:", err);
  }
};