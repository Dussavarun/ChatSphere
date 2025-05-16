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

 
  //fetching messages for that room from the backend

  useEffect(()=>{
       const fetchmessages = async () =>{
        try{
          const res = await axios.get(`${API_BASE_URL}/${groupName}/messages`);
          // setMessages(prev => [...prev , res.data]);
          setMessages(res.data);
        }catch(error){
          console.error("error fetchign group messages")
        }
       };

       fetchmessages()
  },[groupName])

  // Fetch group name
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        console.log(`Fetching group with ID: ${groupchatId}`);
        const res = await axios.get(`${API_BASE_URL}/group/${groupchatId}`);
        console.log("Group data response:", res.data);
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
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now(),
          text: data.message,
          sender: data.sender === userEmail ? "me" : data.sender
        }
      ]);
    };

    // Listen for group messages
    socket.on('group-recieved-message', handleIncomingMessage);
    
    // Cleanup listener when component unmounts
    return () => {
      socket.off("group-recieved-message", handleIncomingMessage);
    };
  }, [userEmail]);

  // Send message function
  const sendMessage = () => {
    if (!input.trim() || !groupName) return;
    
    console.log(`Sending message to group: ${groupName}`);
    
    // Emit message via socket
    socket.emit("groupmessage", {
      groupName,
      sender: userEmail,
      message: input
    });
    
    // (optional as the socket will echo it back)
    // setMessages(prevMessages => [
    //   ...prevMessages,
    //   {
    //     id: Date.now(),
    //     text: input,
    //     sender: "me"
    //   }
    // ]);
    
    setInput("");
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
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
          messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.sender === "me" ? "bg-blue-500 text-white ml-auto" : "bg-gray-200 text-black"
              }`}
            >
              {msg.sender !== "me" && (
                <div className="text-xs font-semibold mb-1">{msg.sender}</div>
              )}
              {msg.text}
            </div>
          ))
        )}
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

export default GroupchatWindow