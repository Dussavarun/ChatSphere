import axios from "axios";
import React, { useEffect, useState } from "react";
import { usechatTypeStore } from "../store/chatTypeStore";

import socket from "../../backend/sockets/socket";
import ChatWindow from "./Chatwindow";
import { Plus } from "lucide-react";
import GroupsDisplay from "./GroupsDisplay";
import GroupCreate from "./GroupCreate";
import { fetchConversations } from "../../backend/controllers/fetchfreindslist";
import GroupchatWindow from "./GroupchatWindow";

const Chatui = () => {
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState("");
  const [conversations, setConversations] = useState([]);
  // const [selectedChat, setSelectedChat] = useState(null);
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [createGroupshow , setcreateGroupshow] = useState(false);
  
  const API_BASE_URL = "http://localhost:3000";

  const selectedChat = usechatTypeStore(state => state.selectedChat);
  const selectedGroup = usechatTypeStore(state => state.selectedGroup);
  const setSelectedChat = usechatTypeStore(state => state.setSelectedChat);
 

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        //foung this route in server.js
        const response = await axios.get(`${API_BASE_URL}/current-user`, { 
          withCredentials: true,
          headers: { 
            "Authorization": token ? `Bearer ${token}` : undefined
          }
        });
        
        const email = response.data.email;
        setUserEmail(email);
        
        // Connect to socket if not already connected
        if (!socket.connected) {
          socket.connect();
          socket.emit("user-login", email);
          socket.emit("join-groups" , email);
          
        }
      } catch (error) {
        console.error("Failed to get current user:", error);
        setError("Authentication failed. Please login again.");
        // Redirect to login if authentication fails
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
  // this fetches the user when he logins only once
  useEffect(() => {
    if(userEmail){
      fetchConversations(userEmail , setIsLoading , setConversations , setError)
    }
  }, [userEmail, API_BASE_URL]);

  //this runs with sockets used for real time fetching here we are again using this for real time fetching thats it the upper code servees the same but it only fetches when the component mounts
  useEffect(() => {
    // Listen for new message notifications
    const handleReceivedMessage = (data) => {
      // Refresh conversations to show updated last message
      if (userEmail) {
        axios.get(`${API_BASE_URL}/message/conversations/${userEmail}`)
          .then(response => setConversations(response.data.conversations || []))
          .catch(error => {
            console.error("Error refreshing conversations:", error);
            setError("Failed to refresh conversations after new message.");
          });
        
        // If the message is for the currently selected chat, it will be handled by ChatWindow
      }
    };

    // Listen for errors
    const handleSocketError = (errorMessage) => {
      setError(errorMessage);
    };

    socket.on("received-message", handleReceivedMessage);
    socket.on("error", handleSocketError);

    // Cleanup function
    return () => {
      socket.off("received-message", handleReceivedMessage);
      socket.off("error", handleSocketError);
    };
  }, [userEmail, API_BASE_URL]); 

  // Function to start a new conversation
  const startNewChat = () => {
    setSelectedChat(null);
  };

  const startNewGroup = () =>{
    console.log("hello group");
  }
  
  // Handle new chat form submission
  // when the user submits the 
  const handleNewChatSubmit = async (e) => {
    e.preventDefault();
    // this new recepeint you will find under chat window
    if (!newRecipientEmail.trim()) {
      setError("Recipient email is required");
      return;
    }
    
    try {
      setIsLoading(true);
      // First check if user exists
      const checkUser = await axios.get(`${API_BASE_URL}/user/check/${newRecipientEmail}`);
      
      if (!checkUser.data.exists) {
        setError("User does not exist");
        return;
      }
      
      // Send an empty first message to create the conversation
      const response = await axios.post(`${API_BASE_URL}/message/send`, {
        senderEmail: userEmail,
        receiverEmail: newRecipientEmail,
        text: "reply to start a conversation"
      });
      
      // Get the conversation ID from the response // data.data is used since it contains a nested data
      const conversationId = response.data.data.conversationId;
      
      // we are seeing this again to refresh the conversations ante kotha convo add ayyindhi ga so
      const convResponse = await fetchConversations(userEmail , setIsLoading , setConversations , setError);
      setConversations(convResponse.data.conversations || []);
      
      // Select the new conversation
      setSelectedChat(conversationId);
      setNewRecipientEmail("");
    } catch (error) {
      console.error("Error creating new conversation:", error);
      setError("Failed to create new conversation");
    } finally {
      setIsLoading(false);
    }
  };  
  
  // console.log(selectedChat);
  // console.log(selectedGroup);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 bg-white shadow flex justify-between items-center">
        <h1 className="text-xl font-semibold">Chat App</h1>
        <div className="flex items-center gap-4">
          <span>{userEmail}</span>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Logout"}
          </button>
        </div>
      </div>
      
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow overflow-hidden flex" style={{ height: "80vh" }}>
          {/* Sidebar for chat list this is used to get all the chats that are related to the user*/}
          <div className="w-1/3 bg-gray-50 border-r">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold">Conversations</h2>
              <button 
                onClick={startNewChat}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                disabled={isLoading}
              >
                New Chat
              </button>
            </div>
            
            <div className="overflow-y-auto" style={{ height: "calc(80vh - 57px)" }}>
              {isLoading && conversations.length === 0 ? (
                <p className="p-4 text-gray-500 text-center">Loading conversations...</p>
              ) : (
                conversations.map((chat) => {
                  // Find the other participant (not current user)
                  const otherUser = chat.participants.find(
                    participant => participant.email !== userEmail
                  );
                  
                  return (
                    <div 
                      key={chat._id} 
                      className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${
                        selectedChat === chat._id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedChat(chat._id)}
                    >
                      <p className="font-medium">{otherUser?.email || "Unknown User"}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage?.text || "No messages yet"}
                      </p>
                      {chat.lastMessage?.createdAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(chat.lastMessage.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
              {/* Groups section */}
               <div className="h-full overflow-y-auto p-4 bg-white rounded-md shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-gray-500 uppercase text-xs tracking-wider">Groups</h2>
                    <button 
                      onClick={() => setcreateGroupshow(true)} 
                      className="text-gray-600 hover:text-black"
                    >
                      <Plus />
                    </button>
                  </div>
                  {
                    // API_BASE_URL = {API_BASE_URL} later you can send if required as a prop now directly declaring there
                    createGroupshow && <GroupCreate onClose = {()=>setcreateGroupshow(false)} />
                  }
                  {/* here goes the list of group chats */}
                  <GroupsDisplay></GroupsDisplay>
              </div>

              
              {!isLoading && conversations.length === 0 && (
                <p className="p-4 text-gray-500 text-center">No conversations yet</p>
              )}
            </div>
          </div>
          
          {/* Chat Window */}
          <div className="w-2/3">
            {selectedChat ? (
              <ChatWindow 
                conversationId={selectedChat} 
                apiBaseUrl={API_BASE_URL}
                onError={(msg) => setError(msg)}
              />
            ) : 
            selectedGroup ? (
                <GroupchatWindow
                   groupchatId = {selectedGroup}
                   apiBaseUrl={API_BASE_URL}
                   onError={(msg) => setError(msg)}
                />
            ) : 
             (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <h3 className="font-medium">New Message</h3>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-6">
                    <p className="text-gray-600 mb-4">
                      Select a conversation from the sidebar or start a new chat
                    </p>
                    <form className="max-w-sm mx-auto" onSubmit={handleNewChatSubmit}>
                      <input
                        type="email"
                        value={newRecipientEmail}
                        onChange={(e) => setNewRecipientEmail(e.target.value)}
                        placeholder="Enter recipient's email"
                        className="w-full p-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        disabled={isLoading}
                      >
                        {isLoading ? "Loading..." : "Start Chat"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError("")}
              className="text-red-700 font-bold"
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