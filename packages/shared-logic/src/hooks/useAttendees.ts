import { useState, useEffect } from 'react';
import { experienceService } from '../services/experienceService';

export interface Attendee {
  first_name: string;
  avatar_url?: string;
}

export function useAttendees(eventId: string | undefined, limit = 5) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attendeesCount, setAttendeesCount] = useState(0);

  useEffect(() => {
    if (!eventId) {
      setAttendees([]);
      setAttendeesCount(0);
      return;
    }

    let cancelled = false;
    experienceService.getAttendees(eventId, limit).then(({ data, count, error }) => {
      if (cancelled || error) return;
      setAttendees((data || []).map((d: any) => d.profiles));
      setAttendeesCount(count || 0);
    });

    return () => { cancelled = true; };
  }, [eventId, limit]);

  return { attendees, attendeesCount };
}
