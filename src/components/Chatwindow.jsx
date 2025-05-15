import React, { useState, useEffect, useRef } from "react";
import socket from "../../backend/sockets/socket";
import { fetchCurrentUser } from "../../backend/controllers/Fetchcurrentuser";
import { fetchConversationDetails } from "../../backend/controllers/fetchConversationDetails";
import { fetchMessages } from "../../backend/controllers/fetchmessages";
import sendMessage from "../../backend/controllers/sending.message";
import { handleNewMessage } from "../../backend/sockets/socket.handlenewmessage";
import Messagecontent from "./Messagecontent";

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

  };

  
  

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="p-3 bg-gray-100 border-b">
      <h3 className="font-medium">
        {isLoading
          ? "Loading..."
          : receiverEmail
        }
      </h3>
      <div className="text-sm">
        {onlinestatus.status === null ? (
          <span className="text-gray-500">Checking status...</span>
        ) : onlinestatus.status ? (
          <span className="text-green-500 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            Online
          </span>
        ) : (
          <span className="text-gray-500 flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
            Offline
            {/* {onlinestatus.lastSeen && (
              <span className="ml-1 text-xs text-gray-400">
                · Last seen {formatLastSeen(onlinestatus.lastSeen)}
              </span>
            )} */}
          </span>
        )}
      </div>

    </div>


      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 ${msg.senderId === userEmail ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  msg.senderId === userEmail
                    ? msg.pending 
                      ? 'bg-blue-300 text-white' // Lighter blue for pending messages
                      : 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <Messagecontent msg={msg}></Messagecontent>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} className="p-3 border-t">
        <div className="flex flex-col">
          <div className="flex mb-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
              className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSending || isLoading}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 disabled:bg-blue-300"
              disabled={isSending || isLoading || (!message.trim() && !file)}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
          
          {/* File input and preview */}
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer mr-3">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-sm text-gray-600">Attach file</span>
              <input 
                type="file"
                onChange={handleFileChange}
                disabled={isSending || isLoading}
                className="hidden"
              />
            </label>
            
            {file && (
              <div className="flex items-center bg-gray-100 p-1 rounded">
                <span className="text-xs text-gray-800 mr-2">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;