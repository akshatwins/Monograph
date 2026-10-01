import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RecentArtist = {
  id: string;
  name: string;
  picture: string;
};

type RecentsState = {
  items: RecentArtist[];
  remember: (artist: RecentArtist) => void;
};

export const useRecentsStore = create<RecentsState>()(
  persist(
    (set, get) => ({
      items: [],
      remember: (artist) => {
        const next = [
          artist,
          ...get().items.filter((i) => i.id !== artist.id),
        ].slice(0, 12);
        set({ items: next });
      },
    }),
    { name: "monograph-recents" },
  ),
);
