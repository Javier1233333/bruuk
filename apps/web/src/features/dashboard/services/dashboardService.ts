import { supabase } from '../../../lib/supabase';

export const dashboardService = {
  getUserBookings: async (userId: string) => {
    return await supabase.from('bookings').select('event_id').eq('user_id', userId);
  },
  getDashboardEvents: async () => {
    return await supabase.from('events').select(`
          *,
          experiences (*)
        `).gte('date', new Date().toISOString());
  },
  createBooking: async (data: any) => {
    return await supabase.from('bookings').insert(data);
  }
};
