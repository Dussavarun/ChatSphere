import {io} from "socket.io-client";

//This creates a socket connection the backend server running at http://localhost:3000 
const socket = io("http://localhost:3000", {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});


  
export default socket;