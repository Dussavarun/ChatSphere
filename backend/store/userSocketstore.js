import { create } from "zustand";
import { userAuthstore } from "./userauthstore";
import socket from "../sockets/clientsocket";

export const userSocketstore = create((set, get) => ({
    socket: null,
    isConnected: false, 
    
    initSocket: () => {
        const { user } = userAuthstore.getState();
        if (!user || get().socket) return;
          
        socket.auth = {
            email: user.email,
            token: localStorage.getItem("token"),
        };
                 
        socket.on("connect", () => {
            set({ isConnected: true }); 
            socket.emit("user-login", user.email);
            socket.emit("join-groups", user.email);
        });
                 
        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
            set({ isConnected: false }); 
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
            set({ isConnected: false }); 
        });
                 
        socket.connect();
        set({ socket });
    },
     
    disconnectSocket: () => {
        const s = get().socket;
        if (s) {
            s.disconnect();
            set({ socket: null, isConnected: false }); 
        }
    },

    
    getConnectionStatus: () => get().isConnected,
    getSocket: () => get().socket,
}));