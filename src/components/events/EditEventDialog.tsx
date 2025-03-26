import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Event } from "@/types/events";

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onSubmit: (updatedEvent: Event) => void;
}

export default function EditEventDialog({
  open,
  onOpenChange,
  event,
  onSubmit,
}: EditEventDialogProps) {
  const [name, setName] = useState(event.name || "");
  const [date, setDate] = useState(event.date || "");
  const [time, setTime] = useState(event.time || "");
  const [location, setLocation] = useState(event.location || "Aula");
  const [mainContact, setMainContact] = useState(event.mainContact || "");
  const [contactInfo, setContactInfo] = useState(event.contactInfo || "");

  // Update form when event changes
  useEffect(() => {
    if (open) {
      setName(event.name || "");
      setDate(event.date || "");
      setTime(event.time || "");
      setLocation(event.location || "Aula");
      setMainContact(event.mainContact || "");
      setContactInfo(event.contactInfo || "");
    }
  }, [open, event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...event,
      name,
      date,
      time,
      location,
      mainContact,
      contactInfo,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Veranstaltung bearbeiten</DialogTitle>
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
            <Label htmlFor="time">Uhrzeit</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
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
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Abbrechen
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
