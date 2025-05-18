import { useEffect, useRef, useState } from "react";
import axios from "axios";
import React from "react";
import { fetchCurrentUser } from "../../backend/controllers/Fetchcurrentuser";
import socket from "../../backend/sockets/socket";


const GroupchatWindow = ({ groupchatId, onError }) => {
  const [groupName, setGroupName] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const API_BASE_URL = "http://localhost:3000";
  
 
  // Fetch current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        await fetchCurrentUser(setIsLoading, setUserEmail, setError);
      } catch (err) {
        console.error("Error fetching current user:", err);
        setError("Failed to authenticate user");
        setIsLoading(false);
      }
    };
    
    getCurrentUser();
  }, []);

  
  // Fetch group name
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/group/${groupchatId}`);
        setGroupName(res.data.name);
      } catch (err) {
        console.error("Error fetching group:", err);
        onError("Could not load group name");
      }
    };

    if (groupchatId) {
      fetchGroup();
    }
  }, [groupchatId, API_BASE_URL]);
 
  //fetching messages for that room from the backend
  useEffect(() => {
    const fetchmessages = async () => {
      try {        
        if (!groupchatId) {
          console.error("Invalid groupchatId:", groupchatId);
          return;
        }
        
        const res = await axios.get(`${API_BASE_URL}/group/groupmessages/${groupchatId}`);        
        const formattedMessages = res.data.map(msg => ({
          ...msg,
          senderId: msg.senderId || {
            email: msg.sender || "unknown", 
            name: msg.senderName || (msg.sender ? msg.sender.split('@')[0] : "Unknown")
          }
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error("Error fetching group messages:", error.response ? error.response.data : error.message);
      }
    };
    
    if (groupchatId) {
      fetchmessages();
    }
  }, [groupchatId, API_BASE_URL]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join group chat room when groupName is available
  useEffect(() => {
    if (groupName && userEmail) {
      console.log(`Joining group chat: ${groupName}`);
      socket.emit("join-groups", userEmail);
    }
  }, [groupName, userEmail]);

  // Handle incoming messages
  useEffect(() => {
    const handleIncomingMessage = (data) => {
      console.log("Received group message:", data);
      // to  ensure the messages send by us is not echoing to ourselves
      if (data.sender !== userEmail) {
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: Date.now(),
            text: data.message,
            senderId: {
              email: data.sender,
              name: data.senderName || data.sender
            }
          }
        ]);
      }
    };

    // to handle incoming group messages
    socket.on('group-recieved-message', handleIncomingMessage);
    
    return () => {
      socket.off("group-recieved-message", handleIncomingMessage);
    };
  }, [userEmail]);

  // Send message function
  const sendMessage = () => {
    if (!input.trim() || !groupName) return;
    
    console.log(`Sending message to group: ${groupName}`);
    
    socket.emit("groupmessage", {
      groupName,
      sender: userEmail,
      message: input
    });
    
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: Date.now(),
        text: input,
        senderId: {
          email: userEmail,
          name: "Me"
        }
      }
    ]);
    
    setInput("");
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // to check if the message is from current user to hanle proper ui
  const isCurrentUserMessage = (message) => {
    return message.senderId?.email === userEmail;
  };

  return (
    <div className="flex flex-col h-full border">
      {/* Header */}
      <div className="bg-gray-100 px-4 py-3 border-b flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black-600">
          {groupName || "Loading..."}
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet</div>
        ) : (
          messages.map((msg, index) => {
            const isMe = isCurrentUserMessage(msg);
            return (
              <div
                key={index}
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  isMe ? "bg-blue-500 text-white ml-auto" : "bg-gray-200 text-black"
                }`}
              >
                {!isMe && (
                  <div className="text-xs font-semibold mb-1">
                    {msg.senderId?.name || (msg.senderId?.email ? msg.senderId.email : 'Unknown')}
                  </div>
                )}
                {msg.text}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} /> {/* Invisible element to scroll to */}
      </div>

      {/* Input */}
      <div className="border-t p-3 flex items-center">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 mr-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message"
          disabled={!groupName}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={!groupName || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GroupchatWindow;