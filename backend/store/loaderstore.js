import { create } from "zustand";

export const useLoaderstate = create({
  showloader: false,
  isLoading: false,
  setShowLoader: (val) => set({ showLoader: val }),
  setIsLoading: (val) => set({ isLoading: val }),
});
