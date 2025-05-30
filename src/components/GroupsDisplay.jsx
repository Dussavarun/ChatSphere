import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchCurrentUser } from '../../backend/controllers/FetchCurrentuser';
import { usechatTypeStore } from '../store/chatTypeStore';
import socket from '../../backend/sockets/socket';

const GroupsDisplay = () => {
  const API_BASE_URL = "http://localhost:3000";
  const [groupchatsList, setGroupchatsList] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const setSelectedGroup = usechatTypeStore((state) => state.setSelectedGroup);

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
  
  // Fetch group chats when userEmail is available
  useEffect(() => {
    if (userEmail) {
      fetchGroupChats(); // initial load
    }
  }, [userEmail]);

  const fetchGroupChats = async () => {
    try {
      console.log("Fetching groups for:", userEmail);
                
      const response = await axios.post(`${API_BASE_URL}/group/groupsList`, {
        userEmail: userEmail
      });
                
      console.log("Groups data received:", response.data);
      setGroupchatsList(response.data);
    } catch (error) {
      console.error("Error fetching group chats:", error);
      setError("Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  };
  // Socket event listeners for real-time updates
  useEffect(() => {
    if (userEmail) {
      // Add event listeners
      const handler = () =>{
        fetchGroupChats();
      }
      socket.on("groupmessage", handler);
      socket.on("group-recieved-message",handler);
      socket.on("group-list-update", handler);

      return () => {
        // cleaning  up the event listeners
        socket.off("groupmessage", handler);
        socket.off("group-recieved-message", handler);
        socket.off("group-list-update", handler);
      };
    }
  }, [userEmail]);


  const handleGroupClick = (groupId) => {
    setSelectedGroup(groupId);
    console.log("Selected group:", groupId);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading groups...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Your Groups</h2>
            
      {groupchatsList.length === 0 ? (
        <p className="text-gray-500 text-center">No groups found.</p>
      ) : (
        <div className="space-y-4">
          {groupchatsList.map((gpchat) => (
            <div 
              key={gpchat._id} 
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleGroupClick(gpchat._id)}
            >
              <h3 className="text-lg font-bold">{gpchat.groupchatName}</h3>
              
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Members: {gpchat.members
                    .slice(0, 4)
                    .map(member => member.email)
                    .join(', ')}
                  {gpchat.members.length > 4 && '...'}
                </p>

                <p className="text-xs text-gray-500">
                  Admin: {gpchat.members.find(member => member.role === "admin")?.email || gpchat.createdBy}
                </p>
              </div>
              
              {/* Display last message if available */}
              {gpchat.lastgroupMessage ? (
                <div className="mt-3">
                  <p className="text-sm font-medium">Latest Message:</p>
                  <div className="mt-1">
                    <span className="text-sm font-medium">
                      {gpchat.lastgroupMessage.senderId?.email || 'Unknown'}: 
                    </span>
                    <span className="text-sm ml-1">
                      {gpchat.lastgroupMessage.text}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(gpchat.lastgroupMessage.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">No messages yet</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsDisplay;
