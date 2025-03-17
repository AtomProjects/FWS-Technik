import { supabase } from "./supabase";
import { Event } from "@/types/events";
import { Tables } from "@/types/supabase";

type DbEvent = Tables<"events">;
type DbEventNote = Tables<"event_notes">;

function mapDbEventToEvent(dbEvent: DbEvent): Event {
  return {
    id: dbEvent.id,
    name: dbEvent.name,
    date: dbEvent.date,
    time: dbEvent.time || undefined,
    location: dbEvent.location,
    contactPersons: dbEvent.contact_persons || [],
    mainContact: dbEvent.main_contact || undefined,
    contactInfo: dbEvent.contact_info || undefined,
  };
}

export async function fetchEvents() {
  // First, fetch all events
  const { data, error } = await supabase.from("events").select("*");

  if (error) throw error;
  if (!data) return [];

  // Map database events to our Event type
  const mappedEvents = data.map(mapDbEventToEvent);

  // Sort events by date and time
  return mappedEvents.sort((a, b) => {
    // First compare by date
    const dateComparison =
      new Date(a.date).getTime() - new Date(b.date).getTime();

    // If dates are different, just return the date comparison
    if (dateComparison !== 0) {
      return dateComparison;
    }

    // If dates are the same, compare by time
    if (a.time && b.time) {
      // Convert time strings to comparable values (assuming format like "14:30")
      const aTime = a.time.split(":").map(Number);
      const bTime = b.time.split(":").map(Number);

      // Compare hours first
      if (aTime[0] !== bTime[0]) {
        return aTime[0] - bTime[0];
      }

      // If hours are the same, compare minutes
      return aTime[1] - bTime[1];
    }

    // If one event has time and the other doesn't (and they have the same date),
    // prioritize the one with time
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;

    // If both events don't have time and have the same date, they're equal
    return 0;
  });
}

export async function createEvent(
  event: Omit<Event, "id" | "contactPersons">,
): Promise<string | undefined> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      name: event.name,
      date: event.date,
      time: event.time,
      location: event.location,
      contact_persons: [],
      main_contact: event.mainContact,
      contact_info: event.contactInfo,
    })
    .select();

  if (error) throw error;
  return data?.[0]?.id;
}

export async function updateEventResponsibilities(
  eventId: string,
  contactPersons: string[],
) {
  const { error } = await supabase
    .from("events")
    .update({ contact_persons: contactPersons })
    .eq("id", eventId);

  if (error) throw error;
}

export async function deleteEvent(eventId: string) {
  const { error } = await supabase.from("events").delete().eq("id", eventId);

  if (error) throw error;
}

export async function fetchEventNotes(eventId: string) {
  const { data, error } = await supabase
    .from("event_notes")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createEventNote(
  eventId: string,
  content: string,
  createdBy: string,
) {
  const { error } = await supabase.from("event_notes").insert({
    event_id: eventId,
    content,
    created_by: createdBy,
  });

  if (error) throw error;
}

export async function deleteEventNote(noteId: string) {
  const { error } = await supabase
    .from("event_notes")
    .delete()
    .eq("id", noteId);

  if (error) throw error;
}
