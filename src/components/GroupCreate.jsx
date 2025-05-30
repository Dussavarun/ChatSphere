import React, { useEffect, useState } from 'react'
import { X } from "lucide-react";
import { fetchCurrentUser } from '../../backend/controllers/FetchCurrentuser.js';
import axios from 'axios';
import { fetchConversations } from '../../backend/controllers/Fetchfreindslist.js';
// import { fetchConversations } from '../../backend/controllers/fetchfreindslist';

const GroupCreate = ({onClose} ) => {

  const API_BASE_URL = "http://localhost:3000";
  
  const [groupName, setGroupName] = useState("");
  const [userEmail , setuserEmail] = useState("");
  const [IsLoading, setIsLoading] = useState();
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);

  const [selectedUsers , setselectedUsers] = useState([]);

  useEffect(()=>{
    fetchCurrentUser(setIsLoading , setuserEmail, error);
  },[API_BASE_URL]);

  useEffect(() => {
    if(userEmail){
        fetchConversations(userEmail , setIsLoading , setConversations , setError)
    }
    else{
        setError("user email is missing")
    }
  }, [userEmail, API_BASE_URL]);
  
 const handleSelect = (userEmail) => {
    setselectedUsers((prev) =>
      prev.includes(userEmail)
        ? prev.filter((email) => email !== userEmail)
        : [...prev, userEmail]
    );
  };

  const handleSubmit = async () => {
    try {
      const uniqueEmails = [...new Set([...selectedUsers, userEmail])];

      const allMembers = uniqueEmails.map(email => ({
          email,
          role: email === userEmail ? "admin" : "member"
      }));

      const response = await axios.post(`${API_BASE_URL}/group/createGroup`, {
        groupchatName : groupName,
        members : allMembers,
        createdBy : userEmail
      });
        alert("Group created successfully!");
        onClose();
    } catch (err) {
      console.error("Error submitting users:", err);
    }
    console.log(selectedUsers);
  };
        return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-black p-6 rounded-xl shadow-xl relative w-full max-w-md">
            <button
                className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                onClick={onClose}
            >
                <X />
            </button>

            <h2 className="text-lg font-semibold mb-4">Create Group</h2>

            <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full border p-2 rounded mb-4"
            />

            <div className="max-h-48 overflow-y-auto mb-4">
              {IsLoading && conversations.length === 0 ? (
                <p className="p-4 text-gray-500 text-center">Loading Friendslist...</p>
              ) : (
                conversations.map((chat) => {
                  // Find the other participant (not current user)
                  const otherUser = chat.participants.find(
                    participant => participant.email !== userEmail
                  );
                  
                  return (
                    <div 
                      key={chat._id} 
                      className="flex items-center gap-2 mb-2"
                    >
                         <input
                            type="checkbox"
                            onChange={() => handleSelect(otherUser.email)}
                            checked={selectedUsers.includes(otherUser.email)}
                         />
                      <p className="font-medium">{otherUser?.email || "Unknown User"}</p>
                    </div>
                  );
                })
              )}
            </div>

            <button
                onClick={handleSubmit}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Create Group
            </button>
            
            </div>
        </div>
        );
}

export default GroupCreate
