import { create } from "zustand";
import { persist } from "zustand/middleware";

export const userAuthstore = create(
  persist(
    (set) => ({
      user: null,
      isLoggedin: false,

      pgp: {
        publickey: null,
        privatekey: null
      },

      setpgpkeys: (keys) =>
        set((state) => ({
          pgp: {
            ...state.pgp,
            ...keys
          }
        })),

      login: (userData) =>
        set({
          user: userData,
          isLoggedin: true
        }),

      logout: () =>
        set({
          user: null,
          isLoggedin: false,
        //   pgp: {
        //     publickey: null,
        //     privatekey: null
        //   }
        })
    }),
    {
      name: "auth-storage",
      getStorage: () => localStorage
    }
  )
);
