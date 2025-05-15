export const handleNewMessage = (data , conversationId , setMessages) => {
    //this is to  check if the message is for this conversation
    if (data.conversationId === conversationId) {
      // console.log("Received new message via socket:", data); used this for code review purpose
      const newMessage = {
        id: Date.now(),
        text: data.message,
        fileUrl: data.fileUrl, 
        fileName: data.fileName, 
        senderId: data.senderEmail,
        createdAt: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, newMessage]);
    }
  };