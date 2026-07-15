import { supabase } from '../../../lib/supabase';

export const oceanService = {
  getSpotLikes: () => {
    return supabase.from('spot_likes').select('spot_id');
  },
  deleteSpotLike: async (id: string) => {
    return await supabase.from('spot_likes').delete().eq('spot_id', id);
  },
  insertSpotLike: async (payload: any) => {
    return await supabase.from('spot_likes').insert(payload);
  }
};
