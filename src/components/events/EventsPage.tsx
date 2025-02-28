import { useState, useEffect } from "react";
import {
  fetchEvents,
  createEvent,
  updateEventResponsibilities,
  deleteEvent,
  createEventNote,
} from "@/lib/events";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import EventsList from "./EventsList";
import NewEventDialog from "./NewEventDialog";
import AssignResponsibilityDialog from "./AssignResponsibilityDialog";
import EventNotesDialog from "./EventNotesDialog";
import { Event } from "@/types/events";
import { useAuth } from "@/contexts/AuthContext";

export default function EventsPage() {
  const { user } = useAuth();
  const isTeacher = user?.username === "Lehrer";

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Veranstaltungen konnten nicht geladen werden.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [selectedEventForNotes, setSelectedEventForNotes] =
    useState<Event | null>(null);

  const addEvent = async (
    newEvent: Omit<Event, "id" | "contactPersons">,
    initialNote?: string,
  ) => {
    try {
      const eventId = await createEvent(newEvent);
      if (initialNote && eventId) {
        await createEventNote(
          eventId,
          initialNote,
          user?.username || "Unknown",
        );
      }
      await loadEvents();
      setIsNewEventDialogOpen(false);
      toast({
        title: "Erfolg",
        description: "Die Veranstaltung wurde erfolgreich erstellt.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Veranstaltung konnte nicht erstellt werden.",
      });
    }
  };

  const handleAssignResponsibility = (event: Event) => {
    if (!isTeacher) {
      setSelectedEvent(event);
    }
  };

  const handleAssign = async (eventId: string, contactPersons: string[]) => {
    try {
      await updateEventResponsibilities(eventId, contactPersons);
      await loadEvents();
      setSelectedEvent(null);
      toast({
        title: "Erfolg",
        description: "Die Verantwortlichen wurden erfolgreich aktualisiert.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Verantwortlichen konnten nicht aktualisiert werden.",
      });
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!isTeacher) {
      setDeleteEventId(eventId);
    }
  };

  const confirmDelete = async () => {
    if (deleteEventId) {
      try {
        await deleteEvent(deleteEventId);
        await loadEvents();
        setDeleteEventId(null);
        toast({
          title: "Erfolg",
          description: "Die Veranstaltung wurde erfolgreich gelöscht.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Fehler",
          description: "Die Veranstaltung konnte nicht gelöscht werden.",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <p>Lade Veranstaltungen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <Card className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
          <h1 className="text-3xl font-bold">Veranstaltungen</h1>
          <Button onClick={() => setIsNewEventDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Neue Veranstaltung
          </Button>
        </div>

        <EventsList
          events={events}
          onAssignResponsibility={handleAssignResponsibility}
          onDeleteEvent={handleDeleteEvent}
          onEventClick={(event) => setSelectedEventForNotes(event)}
          isTeacher={isTeacher}
        />

        <NewEventDialog
          open={isNewEventDialogOpen}
          onOpenChange={setIsNewEventDialogOpen}
          onSubmit={addEvent}
        />

        {selectedEvent && (
          <AssignResponsibilityDialog
            open={!!selectedEvent}
            onOpenChange={(open) => !open && setSelectedEvent(null)}
            event={selectedEvent}
            onAssign={handleAssign}
          />
        )}

        <AlertDialog
          open={!!deleteEventId}
          onOpenChange={() => setDeleteEventId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Veranstaltung löschen</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie diese Veranstaltung wirklich löschen? Diese Aktion
                kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {selectedEventForNotes && (
          <EventNotesDialog
            open={!!selectedEventForNotes}
            onOpenChange={(open) => !open && setSelectedEventForNotes(null)}
            event={selectedEventForNotes}
          />
        )}
      </Card>
    </div>
  );
}
