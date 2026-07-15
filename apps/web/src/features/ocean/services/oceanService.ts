import { supabase } from '../../../lib/supabase';

export const oceanService = {
  getSpotLikes: () => {
    return supabase.from('spot_likes').select('spot_id');
  },
  deleteSpotLike: async (spotId: string, userId?: string, guestId?: string | null) => {
    let query = supabase.from('spot_likes').delete().eq('spot_id', spotId);
    if (userId) query = query.eq('user_id', userId);
    else if (guestId) query = query.eq('guest_uuid', guestId);
    return await query;
  },
  insertSpotLike: async (payload: any) => {
    return await supabase.from('spot_likes').insert(payload);
  },
  getSpotsByCity: async (cityId: string) => {
    return await supabase.from('spots').select('*').eq('city', cityId);
  },
  getExperiencesByCity: async (cityId: string) => {
    return await supabase.from('experiences').select('*').eq('city', cityId).eq('status', 'approved');
  },
  getSavedSpots: async (userId: string) => {
    return await supabase.from('spot_saves').select('spot_id').eq('user_id', userId);
  },
  deleteSpotSave: async (userId: string, spotId: string) => {
    return await supabase.from('spot_saves').delete().eq('user_id', userId).eq('spot_id', spotId);
  },
  insertSpotSave: async (payload: any) => {
    return await supabase.from('spot_saves').insert(payload);
  }
};
