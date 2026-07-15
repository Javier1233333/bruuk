import { supabase } from '../../../lib/supabase';

export const experienceService = {
  createBooking: async (data: any) => {
    return await supabase.from('bookings').insert(data);
  },
  logShareClick: async (data: any) => {
    return await supabase.from('share_clicks').insert(data);
  },
  getApprovedExperiences: async () => {
    return await supabase.from('experiences').select('*').eq('status', 'approved');
  },
  getUpcomingEvents: async () => {
    return await supabase.from('events').select('*').gte('date', new Date().toISOString()).order('date', { ascending: true });
  },
  getAttendees: async (eventId: string, limit: number = 5) => {
    return await supabase.from('bookings').select('profiles(id, first_name, avatar_url)', { count: 'exact' }).eq('event_id', eventId).eq('status', 'confirmed').limit(limit);
  }
};
