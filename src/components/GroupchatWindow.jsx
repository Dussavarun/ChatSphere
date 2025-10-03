import { useEffect, useRef, useState } from "react";
import axios from "axios";
import React from "react";
import socket from "../../backend/sockets/clientsocket";
import { groupfilesharing } from "../../backend/utils/group.filesharing.multer";
import Messagecontent from "./Messagecontent";
import { Send, Paperclip, X, Users } from "lucide-react";
import { userAuthstore } from "../../backend/store/userauthstore";

const GroupchatWindow = ({ groupchatId, onError }) => {
  const [groupName, setGroupName] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const user = userAuthstore((state) => state.user);
  const userEmail = user?.email;

  // const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const API_BASE_URL = "https://chatsphere-2-7q7m.onrender.com"

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

        const res = await axios.get(
          `${API_BASE_URL}/group/groupmessages/${groupchatId}`
        );
        const formattedMessages = res.data.map((msg) => ({
          ...msg,
          senderId: msg.senderId || {
            email: msg.sender || "unknown",
            name:
              msg.senderName ||
              (msg.sender ? msg.sender.split("@")[0] : "Unknown"),
          },
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error(
          "Error fetching group messages:",
          error.response ? error.response.data : error.message
        );
      }
    };

    if (groupchatId) {
      fetchmessages();
    }
  }, [groupchatId, API_BASE_URL]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // to join specific group when the user clicks on other group to chat
  useEffect(() => {
    if (groupchatId && userEmail) {
      console.log(`Joining specific group: ${groupchatId}`);
      socket.emit("join-specific-group", {
        groupId: groupchatId,
        userEmail: userEmail,
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
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Date.now(),
            text: data.message || "",
            senderId: {
              email: data.sender,
              name: data.senderName || data.sender.split("@")[0] || data.sender,
            },
            fileUrl: data.fileUrl || null,
            fileName: data.fileName || null,
            createdAt: data.timestamp || new Date().toISOString(),
          },
        ]);
      }
    };

    // to handle errors
    const handleSocketError = (errorMessage) => {
      console.error("Socket error:", errorMessage);
      setError(
        errorMessage,
        `please refresh the page and start you conversation`
      );
    };

    socket.on("group-recieved-message", handleIncomingMessage);
    socket.on("error", handleSocketError);

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
        API_BASE_URL,
      });
      setInput("");
    } else {
      socket.emit("groupmessage", {
        groupName,
        sender: userEmail,
        message: input.trim(),
        groupId: groupchatId,
      });

      // adding message directly to local state for better ux
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now(),
          text: input.trim(),
          senderId: {
            email: userEmail,
            name: "Me",
          },
          createdAt: new Date().toISOString(),
        },
      ]);
      setInput("");
    }
  };

  const handlemessagedelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/message/message-delete/${id}`);
      console.log("Deleted message id:", id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
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
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-800/50 to-gray-900/50">
      {/* Header */}
      <div className="p-4 bg-black/40 backdrop-blur-sm border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">
              {groupName || "Loading..."}
            </h2>
            {groupchatId && (
              <span className="text-xs text-gray-400">Group Chat</span>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-gradient-to-r from-red-900/80 to-red-800/80 border border-red-600/50 text-red-100 rounded-lg flex justify-between items-center backdrop-blur-sm">
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-200 hover:text-white font-bold text-lg px-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Users className="w-16 h-16 text-gray-500 mb-4" />
            <p className="text-gray-400 text-lg">No messages yet</p>
            <p className="text-gray-500 text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = isCurrentUserMessage(msg);
            return (
              <div
                key={msg._id || `msg-${index}`}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
                    isMe
                      ? "bg-gradient-to-r from-white to-gray-200 text-gray-800 shadow-lg"
                      : "bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-white shadow-lg backdrop-blur-sm"
                  }`}
                >
                  {!isMe && (
                    <div className="text-xs font-semibold mb-2 text-gray-300">
                      {msg.senderId?.name || msg.senderId?.email || "Unknown"}
                    </div>
                  )}

                  <Messagecontent
                    key={msg._id || `content-${index}`}
                    msg={msg}
                    onDelete={() => handlemessagedelete(msg._id)}
                  />
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {file && (
        <div className="px-4 py-2 bg-black/20 backdrop-blur-sm border-t border-gray-700/50">
          <div className="flex items-center bg-gray-700/50 p-3 rounded-xl">
            <Paperclip className="w-4 h-4 text-gray-300 mr-2" />
            <span className="text-sm text-gray-200 flex-1 truncate">
              {file.name}
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-red-400 transition-colors duration-200 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-black/40 backdrop-blur-sm border-t border-gray-700/50">
        <div className="flex items-center space-x-3">
          {/* File attachment button */}
          <label className="flex items-center justify-center w-10 h-10 bg-gray-700/50 hover:bg-gray-600/50 rounded-full cursor-pointer transition-all duration-200 hover:scale-105">
            <Paperclip className="w-5 h-5 text-gray-300" />
            <input
              type="file"
              onChange={(e) => handleFileChange(e.target.files[0])}
              disabled={isLoading}
              className="hidden"
            />
          </label>

          {/* Message input */}
          <input
            type="text"
            className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!groupName || isLoading}
          />

          {/* Send button */}
          <button
            onClick={sendMessage}
            className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-white to-gray-200 text-gray-800 rounded-full hover:from-gray-100 hover:to-white transition-all duration-200 shadow-lg hover:shadow-white/25 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            disabled={!groupName || (!input.trim() && !file) || isLoading}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupchatWindow;
