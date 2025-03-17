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
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map(mapDbEventToEvent);
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
