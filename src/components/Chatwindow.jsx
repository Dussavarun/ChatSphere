import React, { useState, useEffect, useRef } from "react";
import socket from "../../backend/sockets/socket";
import axios from "axios";
import { fetchCurrentUser } from "../../backend/controllers/FetchCurrentuser";
import { fetchConversationDetails } from "../../backend/controllers/FetchConversationDetails";
import { fetchMessages } from "../../backend/controllers/Fetchmessages";
import sendMessage from "../../backend/controllers/Sending.message";
import { handleNewMessage } from "../../backend/sockets/socket.handlenewmessage";
import Messagecontent from "./Messagecontent";
import { Send, Paperclip, X } from "lucide-react";

const ChatWindow = ({ conversationId, apiBaseUrl = "http://localhost:3000", onError }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  //we set the receiver email while fetching the conversation details
  const [receiverEmail, setReceiverEmail] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [file, setFile] = useState(null); // Store actual file object, not just value
  const [onlinestatus , setOnlinestatus] = useState({status : null});
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Format last seen time
  const formatLastSeen = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // to get the  current user on mount
  useEffect(() => {
    fetchCurrentUser(setIsLoading , setUserEmail , onError);
  }, [apiBaseUrl,setUserEmail, onError]);

   
  if(conversationId)
  // Get conversation details // used to fetch the whole data of a conversation room based on convo romm id
  useEffect(() => {
    if (conversationId && userEmail) {
      fetchConversationDetails(apiBaseUrl, conversationId , userEmail , onError , setReceiverEmail , setIsLoading);
    }
  }, [conversationId, userEmail, apiBaseUrl, onError]);

  // Fetch messages for this conversation // this is used 
  useEffect(() => {
    let isMounted = true;

    if (conversationId) {
      fetchMessages(apiBaseUrl , conversationId , setMessages , onError , isMounted , setIsLoading);
    }
    return () => {
      isMounted = false;
    };
  }, [conversationId, apiBaseUrl, onError]);
  
  // Set up socket listener for real-time messages
  useEffect(() => {
    const listener = (data) => handleNewMessage(data, conversationId, setMessages);
    socket.on("received-message", listener);
    return () => {
      socket.off("received-message", listener);
    };
 } , [conversationId]);
  

  useEffect(()=>{
    if(!receiverEmail) return;

    const checkonlinestatus = () =>{
      socket.emit("check-online-status",receiverEmail , (response)=>{
        setOnlinestatus({
            status : response.online,
            lastSeen : response.lastSeen || null
        });
        console.log("Updated online status:", response);
      })
    }

    checkonlinestatus();

    const handlestatuschange = (data) =>{
      if (data.email === receiverEmail) {
        checkonlinestatus({
          status: data.status,
        });
        console.log("Status changed:", data);
      }
    }

    socket.on("user-status-change",handlestatuschange);

    const interval = setInterval(checkonlinestatus, 30000);
    
    return () => {
      socket.off("user-status-change", handlestatuschange);
      clearInterval(interval);
    };
  } , [receiverEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]); //this is used to store the actual file object
    }
  };
  
  const handleSend = async (e) => {
    e.preventDefault();
    sendMessage({
      message,setMessage,
      file,setFile,
      userEmail,receiverEmail,
      setIsSending,setMessages,
      onError, apiBaseUrl
    })
    socket.emit('message', {
    receiverEmail,
    message: message.trim(),
    senderEmail: userEmail
  });

  };

  const handledeletemessage = async(id) =>{
      try {
          await axios.delete(`http://localhost:3000/message/message-delete/${id}`);
          console.log('Deleted message id:', id);
          setMessages(prev => prev.filter(m => m.id !== id));
          console.log("message deleting bro wait");
      } catch (err) {
        console.error("Failed to delete message:", err);
      }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-800/50 to-gray-900/50">
      {/* Chat header */}
      <div className="p-4 bg-black/40 backdrop-blur-sm border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {receiverEmail?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">
              {isLoading ? "Loading..." : receiverEmail}
            </h3>
            <div className="text-sm">
              {onlinestatus.status === null ? (
                <span className="text-gray-400">Checking status...</span>
              ) : onlinestatus.status ? (
                <span className="text-green-400 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Online
                </span>
              ) : (
                <span className="text-gray-400 flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Offline
                  {onlinestatus.lastSeen && (
                    <span className="ml-2 text-xs text-gray-500">
                      · Last seen {formatLastSeen(onlinestatus.lastSeen)}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-pulse text-gray-400">Loading messages...</div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === userEmail ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
                  msg.senderId === userEmail
                    ? msg.pending 
                      ? 'bg-gradient-to-r from-white/60 to-gray-300/60 text-gray-800 shadow-lg' // Lighter for pending messages
                      : 'bg-gradient-to-r from-white to-gray-200 text-gray-800 shadow-lg'
                    : 'bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-white shadow-lg backdrop-blur-sm'
                }`}
              >
                <Messagecontent 
                  key={msg.id} 
                  msg={msg} 
                  onDelete={() => handledeletemessage(msg.id)}
                />
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File preview */}
      {file && (
        <div className="px-4 py-2 bg-black/20 backdrop-blur-sm border-t border-gray-700/50">
          <div className="flex items-center bg-gray-700/50 p-3 rounded-xl">
            <Paperclip className="w-4 h-4 text-gray-300 mr-2" />
            <span className="text-sm text-gray-200 flex-1 truncate">{file.name}</span>
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

      {/* Message input */}
      <form onSubmit={handleSend} className="p-4 bg-black/40 backdrop-blur-sm border-t border-gray-700/50">
        <div className="flex items-center space-x-3">
          {/* File attachment button */}
          <label className="flex items-center justify-center w-10 h-10 bg-gray-700/50 hover:bg-gray-600/50 rounded-full cursor-pointer transition-all duration-200 hover:scale-105">
            <Paperclip className="w-5 h-5 text-gray-300" />
            <input 
              type="file"
              onChange={handleFileChange}
              disabled={isSending || isLoading}
              className="hidden"
            />
          </label>
          
          {/* Message input */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
            disabled={isSending || isLoading}
          />
          
          {/* Send button */}
          <button
            type="submit"
            className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-white to-gray-200 text-gray-800 rounded-full hover:from-gray-100 hover:to-white transition-all duration-200 shadow-lg hover:shadow-white/25 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            disabled={isSending || isLoading || (!message.trim() && !file)}
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;