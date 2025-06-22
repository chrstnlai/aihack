import { create } from 'zustand';
import { supabase } from './supabase';

export interface Dream {
  id: string;
  user_title: string | null;
  ai_title: string;
  ai_description: string;
  transcript_raw: string;
  transcript_json: any;
  video_url: string;
  video_thumbnail: string | null;
  created_at: string;
  emojis: string[];
}

interface DreamStore {
  dreams: Dream[];
  loading: boolean;
  error: string | null;
  fetchDreams: () => Promise<void>;
  addDream: (dream: Omit<Dream, 'id' | 'created_at'>) => Promise<void>;
  updateDream: (id: string, updates: Partial<Dream>) => Promise<void>;
  deleteDream: (id: string) => Promise<void>;
}

export const useDreamStore = create<DreamStore>((set, get) => ({
  dreams: [],
  loading: false,
  error: null,

  fetchDreams: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('dreams')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ dreams: data || [], loading: false });
    }
  },

  addDream: async (dream) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('dreams')
      .insert([{ ...dream }])
      .select();
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ dreams: [ ...(data || []), ...get().dreams ], loading: false });
    }
  },

  updateDream: async (id, updates) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('dreams')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({
        dreams: get().dreams.map(d => d.id === id ? { ...d, ...updates } : d),
        loading: false
      });
    }
  },

  deleteDream: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase
      .from('dreams')
      .delete()
      .eq('id', id);
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ dreams: get().dreams.filter(d => d.id !== id), loading: false });
    }
  },
})); 