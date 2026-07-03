import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makeId } from "@/lib/id";
import type { CourtProfile, PlayerProfile, Tier } from "@/lib/types";

interface ConfigState {
  players: PlayerProfile[];
  courts: CourtProfile[];

  addPlayer: (name: string, tier?: Tier) => string;
  updatePlayer: (id: string, patch: Partial<Omit<PlayerProfile, "id">>) => void;
  removePlayer: (id: string) => void;
  clearPlayers: () => void;

  addCourt: (label: string) => string;
  updateCourt: (id: string, patch: Partial<Omit<CourtProfile, "id">>) => void;
  removeCourt: (id: string) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      players: [],
      courts: [],

      addPlayer: (name, tier) => {
        const id = makeId();
        set((s) => ({
          players: [...s.players, { id, name: name.trim(), tier }],
        }));
        return id;
      },

      updatePlayer: (id, patch) =>
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removePlayer: (id) =>
        set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

      clearPlayers: () => set({ players: [] }),

      addCourt: (label) => {
        const id = makeId();
        set((s) => ({
          courts: [...s.courts, { id, label: label.trim() }],
        }));
        return id;
      },

      updateCourt: (id, patch) =>
        set((s) => ({
          courts: s.courts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      removeCourt: (id) =>
        set((s) => ({ courts: s.courts.filter((c) => c.id !== id) })),
    }),
    {
      name: "buhaominton-config",
      skipHydration: true,
    },
  ),
);
