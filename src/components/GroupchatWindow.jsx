import { useEffect, useRef, useState } from "react";
import axios from "axios";
import React from "react";
import { fetchCurrentUser } from "../../backend/controllers/Fetchcurrentuser";
import socket from "../../backend/sockets/socket";
import { groupfilesharing } from "../../backend/utils/group.filesharing.multer";
import Messagecontent from "./Messagecontent";

const GroupchatWindow = ({ groupchatId, onError }) => {
  const [groupName, setGroupName] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
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

  // Fetch messages for that group
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

  // to join specific group when the user clicks on other group to chat
  useEffect(() => {
    if (groupchatId && userEmail) {
      console.log(`Joining specific group: ${groupchatId}`);
      socket.emit("join-specific-group", {
        groupId: groupchatId,
        userEmail: userEmail
      });
    }
  }, [groupchatId, userEmail]);

  
  useEffect(() => {
    const handleIncomingMessage = (data) => {
      console.log("Received group message:", data);
      
      if (data.groupId && data.groupId !== groupchatId) {
        console.log("Message not for current group, ignoring");
        return;
      }
      
      // to ensure the message is only sent to others and not echoing back
      if (data.sender !== userEmail) {
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: Date.now(),
            text: data.message || "",
            senderId: {
              email: data.sender,
              name: data.senderName || data.sender.split('@')[0] || data.sender
            },
            fileUrl: data.fileUrl || null, 
            fileName: data.fileName || null,
            createdAt: data.timestamp || new Date().toISOString()
          }
        ]);
      }
    };

    // to handle errors
    const handleSocketError = (errorMessage) => {
      console.error("Socket error:", errorMessage);
      setError(errorMessage);
    };

    socket.on('group-recieved-message', handleIncomingMessage);
    socket.on('error', handleSocketError);
    
    return () => {
      socket.off("group-recieved-message", handleIncomingMessage);
      socket.off("error", handleSocketError);
    };
  }, [userEmail, groupchatId]);

  // Send message function
  const sendMessage = () => {
    if (!input.trim() && !file) {
      return;
    }

    if (file) {
      groupfilesharing({
        file, 
        groupName,
        input: input.trim() || "", 
        userEmail, 
        setFile, 
        setMessages, 
        API_BASE_URL
      });
      setInput("");
    } else {
      socket.emit("groupmessage", {
        groupName,
        sender: userEmail,
        message: input.trim(),
        groupId: groupchatId 
      });
      
      // adding message directly to local state for better ux
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now(),
          text: input.trim(),
          senderId: {
            email: userEmail,
            name: "Me"
          },
          createdAt: new Date().toISOString()
        }
      ]);
      setInput("");
    }
  };

  const handlemessagedelete = async(id) => {
    try {
      await axios.delete(`${API_BASE_URL}/message/message-delete/${id}`);
      console.log('Deleted message id:', id);
      setMessages(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileChange = (file) => {
    setFile(file);
  };

  // Check if the message is from current user // just for ui thing 
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
        {groupchatId && (
          <span className="text-xs text-gray-500">ID: {groupchatId}</span>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 text-sm">
          {error}
          <button 
            onClick={() => setError("")}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet</div>
        ) : (
          messages.map((msg, index) => {
            const isMe = isCurrentUserMessage(msg);
            return (
              <div
                key={msg._id || `msg-${index}`}
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  isMe ? "bg-blue-500 text-white ml-auto" : "bg-gray-200 text-black"
                }`}
              >
                {!isMe && (
                  <div className="text-xs font-semibold mb-1">
                    {msg.senderId?.name || msg.senderId?.email || "Unknown"}
                  </div>
                )}

                <Messagecontent 
                  key={msg._id || `content-${index}`} 
                  msg={msg} 
                  onDelete={() => handlemessagedelete(msg._id)}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {file && (
        <div className="border-t p-2">
          <div className="flex items-center bg-gray-100 p-2 rounded">
            <span className="text-xs text-gray-800 mr-2">{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3 flex items-center">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 mr-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message"
          disabled={!groupName || isLoading}
        />
        
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer mr-3">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-sm text-gray-600">Attach file</span>
            <input 
              type="file"
              onChange={(e) => handleFileChange(e.target.files[0])}
              disabled={isLoading}
              className="hidden"
            />
          </label>
        </div>
        
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          disabled={!groupName || (!input.trim() && !file) || isLoading}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default GroupchatWindow;