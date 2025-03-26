import { useState, useEffect } from "react";
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
import { format, isAfter, isBefore, parseISO } from "date-fns";

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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("Aula"); // Default to "Aula"
  const [mainContact, setMainContact] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [addNote, setAddNote] = useState(false);
  const [note, setNote] = useState("");
  const [dateError, setDateError] = useState("");
  const [timeError, setTimeError] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName("");
      setStartDate("");
      setEndDate("");
      setIsMultiDay(false);
      setStartTime("");
      setEndTime("");
      setLocation("Aula"); // Reset to "Aula" when dialog opens
      setMainContact("");
      setContactInfo("");
      setAddNote(false);
      setNote("");
      setDateError("");
      setTimeError("");
    }
  }, [open]);

  // Validate dates when they change
  useEffect(() => {
    if (isMultiDay && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isBefore(end, start)) {
        setDateError("Das Enddatum kann nicht vor dem Startdatum liegen");
      } else {
        setDateError("");
      }
    } else {
      setDateError("");
    }
  }, [startDate, endDate, isMultiDay]);

  // Validate times when they change
  useEffect(() => {
    if (startTime && endTime && !isMultiDay && startDate) {
      // Only validate times for same-day events
      if (startTime >= endTime) {
        setTimeError("Die Endzeit muss nach der Startzeit liegen");
      } else {
        setTimeError("");
      }
    } else {
      setTimeError("");
    }
  }, [startTime, endTime, isMultiDay, startDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Additional validation
    if (dateError || timeError) {
      return;
    }

    // Format time string based on start and end times
    let timeString = "";
    if (startTime) {
      timeString = startTime;
      if (endTime) {
        timeString += `-${endTime}`;
      }
    }

    if (isMultiDay && startDate && endDate) {
      // For multi-day events, create an event for each day in the range
      const events: Omit<Event, "id" | "contactPersons">[] = [];

      // Create dates from the input strings
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Loop through each day in the range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        events.push({
          name,
          date: format(currentDate, "yyyy-MM-dd"),
          time: timeString,
          location,
          mainContact,
          contactInfo,
        });

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Submit all events with the same note
      events.forEach((event, index) => {
        if (index === 0) {
          // Only pass the note with the first event
          onSubmit(event, addNote ? note : undefined);
        } else {
          onSubmit(event);
        }
      });
    } else {
      // For single-day events, just submit one event
      onSubmit(
        {
          name,
          date: startDate,
          time: timeString,
          location,
          mainContact,
          contactInfo,
        },
        addNote ? note : undefined,
      );
    }

    // Form reset is handled in the useEffect
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
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

          <div className="flex items-center space-x-2 mb-2">
            <Checkbox
              id="isMultiDay"
              checked={isMultiDay}
              onCheckedChange={(checked) => {
                setIsMultiDay(checked as boolean);
                if (!checked) {
                  setEndDate("");
                }
              }}
            />
            <Label htmlFor="isMultiDay">Mehrtägige Veranstaltung</Label>
          </div>

          {isMultiDay ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Startdatum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Enddatum</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate} // Prevent end date before start date
                />
                {dateError && (
                  <p className="text-sm text-red-500">{dateError}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="startDate">Datum</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Startzeit</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Endzeit</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
              {timeError && <p className="text-sm text-red-500">{timeError}</p>}
            </div>
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
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={
                !name ||
                !startDate ||
                (isMultiDay && !endDate) ||
                !!dateError ||
                !!timeError
              }
            >
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
