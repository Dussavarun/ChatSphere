import axios from "axios";
import React, { useEffect, useState } from "react";
import { usechatTypeStore } from "../store/chatTypeStore";
import socket from "../../backend/sockets/socket";
import ChatWindow from "./Chatwindow";
import { Plus, MessageCircle, Users, LogOut, Send } from "lucide-react";
import GroupsDisplay from "./GroupsDisplay";
import GroupCreate from "./GroupCreate";
import { fetchConversations } from "../../backend/controllers/Fetchfreindslist";
import GroupchatWindow from "./GroupchatWindow";

const Chatui = () => {
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState("");
  const [conversations, setConversations] = useState([]);
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createGroupshow, setcreateGroupshow] = useState(false);
  
  const API_BASE_URL = "http://localhost:3000";

  const selectedChat = usechatTypeStore(state => state.selectedChat);
  const selectedGroup = usechatTypeStore(state => state.selectedGroup);
  const setSelectedChat = usechatTypeStore(state => state.setSelectedChat);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/current-user`, { 
          withCredentials: true,
          headers: { 
            "Authorization": token ? `Bearer ${token}` : undefined
          }
        });
        
        const email = response.data.email;
        setUserEmail(email);
        
        if (!socket.connected) {
          socket.connect();
          socket.emit("user-login", email);
          socket.emit("join-groups", email);
        }
      } catch (error) {
        console.error("Failed to get current user:", error);
        setError("Authentication failed. Please login again.");
        window.location.href = "/";
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();

    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [API_BASE_URL]);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/logout`, {}, { withCredentials: true });
      localStorage.removeItem("token");
      socket.disconnect();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Logout failed. Please try again.");
    }
  };

  useEffect(() => {
    if(userEmail){
      fetchConversations(userEmail, setIsLoading, setConversations, setError)
    }
  }, [userEmail, API_BASE_URL]);

 useEffect(() => {
  if (userEmail) {
    const handler = () => {
      fetchConversations(userEmail, setIsLoading, setConversations, setError);
    };

    socket.on("message", handler);
    socket.on("convo-list-update", handler);

    return () => {
      socket.off("message", handler);
      socket.off("convo-list-update", handler);
    };
  }
}, [userEmail]);

  useEffect(() => {
    const handleReceivedMessage = (data) => {
      if (userEmail) {
        axios.get(`${API_BASE_URL}/message/conversations/${userEmail}`)
          .then(response => setConversations(response.data.conversations || []))
          .catch(error => {
            console.error("Error refreshing conversations:", error);
            setError("Failed to refresh conversations after new message.");
          });
      }
    };

    const handleSocketError = (errorMessage) => {
      setError(errorMessage);
    };

    socket.on("received-message", handleReceivedMessage);
    socket.on("error", handleSocketError);

    return () => {
      socket.off("received-message", handleReceivedMessage);
      socket.off("error", handleSocketError);
    };
  }, [userEmail, API_BASE_URL]); 

  const startNewChat = () => {
    setSelectedChat(null);
  };

  const handleNewChatSubmit = async (e) => {
    e.preventDefault();
    if (!newRecipientEmail.trim()) {
      setError("Recipient email is required");
      return;
    }
    
    try {
      setIsLoading(true);
      const checkUser = await axios.get(`${API_BASE_URL}/user/check/${newRecipientEmail}`);
      
      if (!checkUser.data.exists) {
        setError("User does not exist");
        return;
      }
      
      const response = await axios.post(`${API_BASE_URL}/message/send`, {
        senderEmail: userEmail,
        receiverEmail: newRecipientEmail,
        text: "reply to start a conversation"
      });
      
      const conversationId = response.data.data.conversationId;
      
      const convResponse = await fetchConversations(userEmail, setIsLoading, setConversations, setError);
      setConversations(convResponse.data.conversations || []);
      
      setSelectedChat(conversationId);
      setNewRecipientEmail("");
    } catch (error) {
      console.error("Error creating new conversation:", error);
      setError("Failed to create new conversation");
    } finally {
      setIsLoading(false);
    }
  };  
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-gray-700 shadow-2xl">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-white to-gray-300 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              ChatSphere
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-400">Welcome,</span>
              <span className="ml-1 font-medium text-white">{userEmail}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-red-500/25 disabled:opacity-50"
              disabled={isLoading}
            >
              <LogOut className="w-4 h-4" />
              {isLoading ? "Loading..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-4">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50" style={{ height: "85vh" }}>
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-full md:w-1/3 bg-gradient-to-b from-gray-900/80 to-black/80 border-r border-gray-700/50">
              {/* Conversations Header */}
              <div className="p-4 border-b border-gray-700/50 bg-black/30">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-white" />
                    <h2 className="font-bold text-lg text-white">Conversations</h2>
                  </div>
                  <button 
                    onClick={startNewChat}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-white to-gray-200 text-black rounded-lg text-sm hover:from-gray-100 hover:to-white transition-all duration-200 shadow-lg hover:shadow-white/25 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4" />
                    New Chat
                  </button>
                </div>
              </div>
            
              {/* Conversations List */}
              <div className="overflow-y-auto flex-1" style={{ height: "calc(85vh - 120px)", scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {isLoading && conversations.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-3 bg-gray-800 rounded w-1/2 mx-auto"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {conversations.map((chat) => {
                      const otherUser = chat.participants.find(
                        participant => participant.email !== userEmail
                      );
                      const isSelected = selectedChat === chat._id;
                      
                      return (
                        <div 
                          key={chat._id} 
                          className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? 'bg-gradient-to-r from-white/20 to-gray-300/20 border border-white/30 shadow-lg' 
                              : 'hover:bg-white/10 border border-transparent hover:border-white/20'
                          }`}
                          onClick={() => setSelectedChat(chat._id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-black-600 to-gray-700 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {otherUser?.email?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate">
                                {otherUser?.email || "Unknown User"}
                              </p>
                              <p className="text-sm text-gray-400 truncate">
                                {chat.lastMessage?.text || "No messages yet"}
                              </p>
                              {chat.lastMessage?.createdAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(chat.lastMessage.createdAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Groups Section */}
                <div className="p-4 border-t border-gray-700/50 bg-black/20">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-white" />
                      <h2 className="font-semibold text-white text-sm uppercase tracking-wider">Groups</h2>
                    </div>
                    <button 
                      onClick={() => setcreateGroupshow(true)} 
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {createGroupshow && <GroupCreate onClose={() => setcreateGroupshow(false)} />}
                  <GroupsDisplay />
                </div>

                {!isLoading && conversations.length === 0 && (
                  <div className="p-4 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No conversations yet</p>
                    <p className="text-gray-500 text-sm">create a new chat to begin messaging</p>
                  </div>
                )}
              </div>
            </div>
          
            {/* Chat Window */}
            <div className="w-full md:w-2/3 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
              {selectedChat ? (
                <ChatWindow 
                  conversationId={selectedChat} 
                  apiBaseUrl={API_BASE_URL}
                  onError={(msg) => setError(msg)}
                />
              ) : selectedGroup ? (
                <GroupchatWindow
                   groupchatId={selectedGroup}
                   onError={(msg) => setError(msg)}
                />
              ) : (
                <div className="h-full flex flex-col">
                  <div className="p-6 border-b border-gray-700/50 bg-black/30">
                    <h3 className="font-medium text-xl text-white">New Message</h3>
                    <p className="text-gray-400 text-sm mt-1">Start a conversation with someone new</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                      <div className="w-20 h-20 bg-gradient-to-r from-white/10 to-gray-300/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Send className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Start a Conversation</h3>
                      <p className="text-gray-400 mb-6">
                        Select a conversation from the sidebar or create a new chat below
                      </p>
                      <form className="space-y-4" onSubmit={handleNewChatSubmit}>
                        <div className="relative">
                          <input
                            type="email"
                            value={newRecipientEmail}
                            onChange={(e) => setNewRecipientEmail(e.target.value)}
                            placeholder="Enter recipient's email address"
                            className="w-full p-4 bg-black/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                            disabled={isLoading}
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-white to-gray-200 text-black rounded-xl hover:from-gray-100 hover:to-white transition-all duration-200 shadow-lg hover:shadow-white/25 disabled:opacity-50 font-medium"
                          disabled={isLoading}
                        >
                          <Send className="w-5 h-5" />
                          {isLoading ? "Creating Chat..." : "Start Chat"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-gradient-to-r from-red-900/80 to-red-800/80 border border-red-600/50 text-red-100 rounded-xl flex justify-between items-center backdrop-blur-sm">
            <span>{error}</span>
            <button 
              onClick={() => setError("")}
              className="text-red-200 hover:text-white font-bold text-xl px-2"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatui;