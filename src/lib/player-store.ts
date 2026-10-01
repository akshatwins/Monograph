import { create } from "zustand";
import type { CatalogTrack } from "@/lib/catalog/types";

type PlayerState = {
  queue: CatalogTrack[];
  index: number;
  playing: boolean;
  play: (tracks: CatalogTrack[], index?: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  setPlaying: (playing: boolean) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  playing: false,
  play: (tracks, index = 0) => {
    const playable = tracks.filter((t) => t.preview);
    if (playable.length === 0) return;
    const target = tracks[index];
    const mapped = target?.preview
      ? playable.findIndex((t) => t.id === target.id)
      : 0;
    set({
      queue: playable,
      index: mapped < 0 ? 0 : mapped,
      playing: true,
    });
  },
  toggle: () => {
    const { queue, playing } = get();
    if (queue.length === 0) return;
    set({ playing: !playing });
  },
  next: () => {
    const { queue, index } = get();
    if (queue.length === 0) return;
    set({ index: (index + 1) % queue.length, playing: true });
  },
  prev: () => {
    const { queue, index } = get();
    if (queue.length === 0) return;
    set({ index: (index - 1 + queue.length) % queue.length, playing: true });
  },
  setPlaying: (playing) => set({ playing }),
}));

export function useNowPlaying() {
  return usePlayerStore((s) => s.queue[s.index] ?? null);
}
