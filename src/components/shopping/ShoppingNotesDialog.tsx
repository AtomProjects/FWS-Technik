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
import { ShoppingItem } from "@/types/shopping";
import {
  fetchShoppingNotes,
  createShoppingNote,
  deleteShoppingNote,
} from "@/lib/shopping";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
}

interface ShoppingNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ShoppingItem;
}

export default function ShoppingNotesDialog({
  open,
  onOpenChange,
  item,
}: ShoppingNotesDialogProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadNotes();
    }
  }, [open, item.id]);

  const loadNotes = async () => {
    try {
      const data = await fetchShoppingNotes(item.id);
      setNotes(data);
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteShoppingNote(noteId);
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
      await createShoppingNote(item.id, newNote, user.username);
      await loadNotes();
      setNewNote("");
      toast({
        title: "Erfolg",
        description: "Die Notiz wurde erfolgreich hinzugefügt.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Notiz konnte nicht hinzugefügt werden.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notizen - {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ScrollArea className="h-[300px] rounded-md border p-4">
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
          </ScrollArea>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Neue Notiz hinzufügen..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Schließen
              </Button>
              <Button
                type="submit"
                disabled={!newNote.trim()}
                className="w-full sm:w-auto"
              >
                Notiz hinzufügen
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
