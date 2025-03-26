import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { Event } from "@/types/events";
import {
  fetchEventNotes,
  createEventNote,
  deleteEventNote,
} from "@/lib/events";
import { Trash2, UserPlus, Calendar, Pencil } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
}

interface EventNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onAssignResponsibility?: (event: Event) => void;
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (event: Event) => void;
  isTeacher?: boolean;
}

export default function EventNotesDialog({
  open,
  onOpenChange,
  event,
  onAssignResponsibility,
  onDeleteEvent,
  onEditEvent,
  isTeacher = false,
}: EventNotesDialogProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadNotes();
    }
  }, [open, event.id]);

  const loadNotes = async () => {
    try {
      const data = await fetchEventNotes(event.id);
      setNotes(data);
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteEventNote(noteId);
      await loadNotes();
      toast({
        title: "Erfolg",
        description: "Die Notiz wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Notiz konnte nicht gelöscht werden.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !user) return;

    try {
      await createEventNote(event.id, newNote, user.username);
      await loadNotes();
      setNewNote("");
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  // Format date for display
  const formattedDate = event.date
    ? format(new Date(event.date), "dd. MMMM yyyy", { locale: de })
    : "";

  // Check if fields have data to conditionally display them
  const hasLocation = !!event.location;
  const hasMainContact = !!event.mainContact;
  const hasContactInfo = !!event.contactInfo;
  const hasContactPersons =
    event.contactPersons && event.contactPersons.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{event.name}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow overflow-y-auto pr-4">
          {/* Event Information Section */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formattedDate}</span>
              {event.time && (
                <span className="text-muted-foreground">{event.time} Uhr</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hasLocation && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Ort
                  </h3>
                  <p>{event.location}</p>
                </div>
              )}

              {hasMainContact && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Ansprechperson
                  </h3>
                  <p>{event.mainContact}</p>
                </div>
              )}

              {hasContactInfo && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Kontakt
                  </h3>
                  <p>{event.contactInfo}</p>
                </div>
              )}

              {(hasContactPersons || onAssignResponsibility) && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Verantwortlich
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hasContactPersons ? (
                      event.contactPersons.map((person) => (
                        <Badge key={person} variant="outline">
                          {person}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Niemand zugewiesen
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              {onEditEvent && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    onEditEvent(event);
                    onOpenChange(false);
                  }}
                  title="Bearbeiten"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}

              {onAssignResponsibility && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    onAssignResponsibility(event);
                    onOpenChange(false);
                  }}
                  title="Verantwortliche zuweisen"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              )}

              {onDeleteEvent && !isTeacher && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    onDeleteEvent(event.id);
                    onOpenChange(false);
                  }}
                  title="Löschen"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Notes Section */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Notizen</h2>
            <div className="rounded-md border p-4 max-h-[250px] overflow-y-auto">
              <div className="space-y-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg bg-muted p-3 text-sm space-y-1 group relative"
                  >
                    <p>{note.content}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        {note.created_by} -{" "}
                        {new Date(note.created_at).toLocaleString("de-DE")}
                      </p>
                      {note.created_by === user?.username && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    Noch keine Notizen vorhanden
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 pt-4 border-t">
          <Textarea
            placeholder="Neue Notiz hinzufügen..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Schließen
            </Button>
            <Button type="submit" disabled={!newNote.trim()}>
              Notiz hinzufügen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
