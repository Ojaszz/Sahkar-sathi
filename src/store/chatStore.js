import { create } from 'zustand';
import { api } from '../services/mockApi';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,

  async openConversation(customerId, workerId) {
    const conv = await api.getConversation(customerId, workerId);
    set({ activeConversation: conv });
    await get().refreshConversations(customerId, workerId);
    return conv;
  },

  async refreshConversations(userId, workerId) {
    const conv = await api.getConversation(userId, workerId);
    set({ activeConversation: conv });
    return conv;
  },

  async sendMessage(text) {
    const conv = get().activeConversation;
    const user = get().currentUser;
    if (!conv || !user) return;
    await api.sendMessage(conv.id, user.id, text);
    await get().refreshConversations(conv.participants[0], conv.participants[1]);
  },

  setCurrentUser(user) {
    set({ currentUser: user });
  },
}));