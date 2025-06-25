import {create} from "zustand";

export const usechatTypeStore = create((set)=>({
    selectedChat : null,
    selectedGroup : null,
    setSelectedChat: (chatId) => set({selectedChat: chatId, selectedGroup: null}),
    setSelectedGroup : (groupId) => set({selectedGroup : groupId , selectedChat : null})
}));


