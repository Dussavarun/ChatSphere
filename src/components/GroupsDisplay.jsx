import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchCurrentUser } from '../../backend/controllers/Fetchcurrentuser';
import { usechatTypeStore } from '../store/chatTypeStore';

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
      fetchGroupChats();
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

  const handleGroupClick = (groupId) => {
    setSelectedGroup(groupId);
    // You might want to add additional logic here
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
                  Members: {gpchat.members.map(member => member.email).join(', ')}
                </p>
                <p className="text-xs text-gray-500">
                  Admin: {gpchat.members.find(member => member.role === "admin")?.email || gpchat.createdBy}
                </p>
              </div>
              
              {gpchat.messages && gpchat.messages.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm font-medium">Latest Messages:</p>
                  <ul className="mt-1 space-y-1">
                    {gpchat.messages.slice(0, 3).map((msg, idx) => (
                      <li key={idx} className="text-sm">
                        <span className="font-medium">{msg.sender}: </span>
                        {msg.content}
                      </li>
                    ))}
                  </ul>
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
