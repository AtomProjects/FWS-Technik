import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Event } from "@/types/events";

interface AssignResponsibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onAssign: (eventId: string, contactPersons: string[]) => void;
}

const AVAILABLE_USERS = [
  "Jakob",
  "Michel",
  "Ben",
  "Erik",
  "Lotta",
  "Matthes",
  "Theo",
  "Louis",
];

export default function AssignResponsibilityDialog({
  open,
  onOpenChange,
  event,
  onAssign,
}: AssignResponsibilityDialogProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    event.contactPersons,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign(event.id, selectedUsers);
    onOpenChange(false);
  };

  const toggleUser = (user: string) => {
    setSelectedUsers((prev) =>
      prev.includes(user) ? prev.filter((u) => u !== user) : [...prev, user],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verantwortliche zuweisen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {AVAILABLE_USERS.map((user) => (
              <div key={user} className="flex items-center space-x-2">
                <Checkbox
                  id={user}
                  checked={selectedUsers.includes(user)}
                  onCheckedChange={() => toggleUser(user)}
                />
                <Label htmlFor={user}>{user}</Label>
              </div>
            ))}
          </div>
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
