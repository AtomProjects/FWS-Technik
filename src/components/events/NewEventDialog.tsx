import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Event } from "@/types/events";

interface NewEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    event: Omit<Event, "id" | "contactPersons">,
    initialNote?: string,
  ) => void;
}

export default function NewEventDialog({
  open,
  onOpenChange,
  onSubmit,
}: NewEventDialogProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [mainContact, setMainContact] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [addNote, setAddNote] = useState(false);
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      {
        name,
        date,
        location,
        mainContact,
        contactInfo,
      },
      addNote ? note : undefined,
    );
    setName("");
    setDate("");
    setLocation("");
    setMainContact("");
    setContactInfo("");
    setAddNote(false);
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Veranstaltung</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Datum</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Ort</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mainContact">Ansprechperson</Label>
            <Input
              id="mainContact"
              value={mainContact}
              onChange={(e) => setMainContact(e.target.value)}
              placeholder="Name der Ansprechperson"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactInfo">
              Kontaktmöglichkeit (Tel./E-Mail)
            </Label>
            <Input
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Telefonnummer oder E-Mail-Adresse"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="addNote"
              checked={addNote}
              onCheckedChange={(checked) => setAddNote(checked as boolean)}
            />
            <Label htmlFor="addNote">Notiz hinzufügen</Label>
          </div>
          {addNote && (
            <div className="space-y-2">
              <Label htmlFor="note">Notiz</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ihre Notiz..."
                className="min-h-[100px]"
                required={addNote}
              />
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit">Speichern</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
