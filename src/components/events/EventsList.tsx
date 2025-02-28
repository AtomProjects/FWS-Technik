import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus, Trash2 } from "lucide-react";
import { Event } from "@/types/events";

interface EventsListProps {
  events: Event[];
  onAssignResponsibility: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
  onEventClick?: (event: Event) => void;
  isTeacher: boolean;
}

export default function EventsList({
  events,
  onAssignResponsibility,
  onDeleteEvent,
  onEventClick,
  isTeacher,
}: EventsListProps) {
  const handleRowClick = (event: Event, e: React.MouseEvent) => {
    // Don't trigger row click when clicking action buttons
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    if (!isTeacher && onEventClick) {
      onEventClick(event);
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Name</TableHead>
            <TableHead className="whitespace-nowrap">Datum</TableHead>
            <TableHead className="whitespace-nowrap">Ort</TableHead>
            <TableHead className="whitespace-nowrap">Ansprechperson</TableHead>
            <TableHead className="whitespace-nowrap">Kontakt</TableHead>
            <TableHead className="whitespace-nowrap">Verantwortlich</TableHead>
            {!isTeacher && <TableHead className="w-[120px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow
              key={event.id}
              className={!isTeacher ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={(e) => handleRowClick(event, e)}
            >
              <TableCell className="font-medium whitespace-nowrap">
                {event.name}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {new Date(event.date).toLocaleDateString("de-DE")}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {event.location}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {event.mainContact || "-"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {event.contactInfo || "-"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {event.contactPersons.length > 0
                  ? event.contactPersons.join(", ")
                  : "-"}
              </TableCell>
              {!isTeacher && (
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssignResponsibility(event);
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEvent(event.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
