import { supabase } from '../lib/supabaseClient';

export const userService = {
  getProfile: async (userId: string) => {
    return await supabase.from('profiles').select('*').eq('id', userId).single();
  },
  getUserSpotSaves: async (userId: string) => {
    return await supabase.from('spot_saves').select('spot_id, spots(*)').eq('user_id', userId);
  },
  getUserBookings: async (userId: string) => {
    return await supabase.from('bookings').select('event_id, events(*, experiences(*))').eq('user_id', userId);
  },
  getUserExperiences: async (userId: string) => {
    return await supabase.from('experiences').select('*, events(*, bookings(*, profiles(*)))').eq('host_id', userId);
  },
  getShareClicksCount: async (expIds: string[]) => {
    return await supabase.from('share_clicks').select('*', { count: 'exact', head: true }).in('experience_id', expIds);
  },
  getBookingsCount: async (expIds: string[]) => {
    return await supabase.from('bookings').select('*, events!inner(experience_id)', { count: 'exact', head: true }).in('events.experience_id', expIds);
  },
  getPendingExperiences: async () => {
    return await supabase.from('experiences').select('*').eq('status', 'pending');
  },
  updateProfile: async (userId: string, data: any) => {
    return await supabase.from('profiles').update(data).eq('id', userId);
  },
  approveExperience: async (expId: string) => {
    return await supabase.from('experiences').update({ status: 'approved' }).eq('id', expId);
  },
  verifyInviteCode: async (code: string) => {
    return await supabase.rpc('verify_and_use_invite_code', { user_code: code });
  },
  checkUsernameAvailability: async (username: string, excludeUserId?: string) => {
    let query = supabase.from('profiles').select('id').eq('username', username);
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }
    const { data, error } = await query;
    return { isAvailable: error ? false : (data?.length === 0), error };
  },
  deleteOwnAccount: async () => {
    return await supabase.rpc('delete_own_user');
  }
};
