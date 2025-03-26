import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Event } from "@/types/events";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import FullCalendar and required plugins
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import deLocale from "@fullcalendar/core/locales/de";

// Import CSS
import "./calendar-styles.css";

interface CalendarViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  onAddEvents?: (events: Event[], initialNote?: string) => void;
}

export default function CalendarView({
  events,
  onEventClick,
  onAddEvents,
}: CalendarViewProps) {
  // State for selected dates and dialog
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State for new event form
  const [newEventName, setNewEventName] = useState("");
  const [newEventStartTime, setNewEventStartTime] = useState("");
  const [newEventEndTime, setNewEventEndTime] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("Aula");
  const [newEventMainContact, setNewEventMainContact] = useState("");
  const [newEventContactInfo, setNewEventContactInfo] = useState("");
  const [addNote, setAddNote] = useState(false);
  const [note, setNote] = useState("");
  const [timeError, setTimeError] = useState("");

  // State for calendar view
  const [currentView, setCurrentView] = useState("dayGridMonth");

  // Reference to the calendar API
  const calendarRef = useRef<any>(null);

  // State for responsive design
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 640;

  // Validate times when they change
  useEffect(() => {
    if (newEventStartTime && newEventEndTime) {
      if (newEventStartTime >= newEventEndTime) {
        setTimeError("Die Endzeit muss nach der Startzeit liegen");
      } else {
        setTimeError("");
      }
    } else {
      setTimeError("");
    }
  }, [newEventStartTime, newEventEndTime]);

  // Group events by name, location, and consecutive dates
  const groupedEvents = useCallback(() => {
    // Create a map to store event sequences
    const eventSequences: { [key: string]: Event[] } = {};

    // First, group events by name and location
    const eventGroups: { [key: string]: Event[] } = {};
    events.forEach((event) => {
      const key = `${event.name}-${event.location}`;
      if (!eventGroups[key]) {
        eventGroups[key] = [];
      }
      eventGroups[key].push(event);
    });

    // For each group, find consecutive date sequences
    Object.entries(eventGroups).forEach(([key, groupEvents]) => {
      // Sort by date
      groupEvents.sort((a, b) => a.date.localeCompare(b.date));

      // Find consecutive sequences
      let currentSequence: Event[] = [groupEvents[0]];
      let sequenceKey = `${key}-seq-0`;
      eventSequences[sequenceKey] = currentSequence;
      let sequenceCounter = 1;

      for (let i = 1; i < groupEvents.length; i++) {
        const currentEvent = groupEvents[i];
        const prevEvent = groupEvents[i - 1];

        const currentDate = new Date(currentEvent.date);
        const prevDate = new Date(prevEvent.date);

        // Check if dates are consecutive (1 day apart)
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Add to current sequence
          currentSequence.push(currentEvent);
        } else {
          // Start a new sequence
          currentSequence = [currentEvent];
          sequenceKey = `${key}-seq-${sequenceCounter++}`;
          eventSequences[sequenceKey] = currentSequence;
        }
      }
    });

    return eventSequences;
  }, [events]);

  // Format events for FullCalendar
  const formattedEvents = useCallback(() => {
    const sequences = groupedEvents();
    const result = [];

    // Process each sequence
    for (const sequenceKey in sequences) {
      const sequence = sequences[sequenceKey];
      if (sequence.length === 0) continue;

      // Use the first event as the base for properties
      const baseEvent = sequence[0];

      // For Month view, create connected multi-day events
      if (currentView === "dayGridMonth") {
        // Calculate start and end dates
        let startDate = baseEvent.date;
        let endDate = sequence[sequence.length - 1].date;

        // For FullCalendar, end date is exclusive, so add one day
        const exclusiveEndDate = new Date(endDate);
        exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);
        endDate = format(exclusiveEndDate, "yyyy-MM-dd");

        // Parse time information if available
        let startDateTime = startDate;
        let endDateTime = endDate;

        if (baseEvent.time) {
          // Check if time contains a range (e.g., "09:00-10:30")
          const timeRangeMatch = baseEvent.time.match(
            /(\d{1,2}:\d{2})(?:\s*-\s*(\d{1,2}:\d{2}))?/,
          );

          if (timeRangeMatch) {
            const startTime = timeRangeMatch[1];
            const endTime = timeRangeMatch[2] || ""; // May be undefined if no end time

            // Add start time to start date
            if (startTime) {
              startDateTime = `${startDate}T${startTime}:00`;
            }

            // Add end time to end date if available, otherwise use same date as start
            if (endTime) {
              // If this is a single-day event, use the same date
              if (sequence.length === 1) {
                endDateTime = `${startDate}T${endTime}:00`;
              } else {
                // For multi-day events, add end time to end date
                // Subtract one day because FullCalendar's end date is exclusive
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
                endDateTime = `${format(adjustedEndDate, "yyyy-MM-dd")}T${endTime}:00`;
              }
            }
          } else {
            // If time doesn't match the expected format, just add it to the start date
            startDateTime = `${startDate}T${baseEvent.time}:00`;
          }
        }

        // Create a single event for the entire sequence
        result.push({
          id: baseEvent.id,
          title: baseEvent.name,
          start: startDateTime,
          end: endDateTime !== startDateTime ? endDateTime : undefined, // Only set end if it's different from start
          allDay: !baseEvent.time,
          extendedProps: {
            location: baseEvent.location,
            mainContact: baseEvent.mainContact,
            contactInfo: baseEvent.contactInfo,
            contactPersons: baseEvent.contactPersons,
            time: baseEvent.time,
            originalEvent: baseEvent, // Store the original event for reference
            eventSequence: sequence, // Store all events in the sequence
          },
          backgroundColor:
            baseEvent.location.toLowerCase() === "aula" ? "#4ade80" : "#60a5fa",
          borderColor:
            baseEvent.location.toLowerCase() === "aula" ? "#22c55e" : "#3b82f6",
          textColor: "#000000", // Black text for better readability
        });
      }
      // For Week and List views, create separate events for each day with the same time
      else {
        // Parse time information if available
        if (baseEvent.time) {
          // Check if time contains a range (e.g., "09:00-10:30")
          const timeRangeMatch = baseEvent.time.match(
            /(\d{1,2}:\d{2})(?:\s*-\s*(\d{1,2}:\d{2}))?/,
          );

          if (timeRangeMatch) {
            const startTime = timeRangeMatch[1];
            const endTime = timeRangeMatch[2] || ""; // May be undefined if no end time

            // Create separate events for each day in the sequence with the same time
            sequence.forEach((event) => {
              const eventDate = event.date;
              let startDateTime = eventDate;
              let endDateTime = undefined;

              // Add start time to date
              if (startTime) {
                startDateTime = `${eventDate}T${startTime}:00`;
              }

              // Add end time to same date if available
              if (endTime) {
                endDateTime = `${eventDate}T${endTime}:00`;
              }

              // Create an event for this day
              result.push({
                id: event.id,
                title: event.name,
                start: startDateTime,
                end: endDateTime,
                allDay: !event.time,
                extendedProps: {
                  location: event.location,
                  mainContact: event.mainContact,
                  contactInfo: event.contactInfo,
                  contactPersons: event.contactPersons,
                  time: event.time,
                  originalEvent: event,
                  eventSequence: sequence,
                },
                backgroundColor:
                  event.location.toLowerCase() === "aula"
                    ? "#4ade80"
                    : "#60a5fa",
                borderColor:
                  event.location.toLowerCase() === "aula"
                    ? "#22c55e"
                    : "#3b82f6",
                textColor: "#000000", // Black text for better readability
              });
            });
          } else {
            // If time doesn't match the expected format, create separate events for each day
            sequence.forEach((event) => {
              result.push({
                id: event.id,
                title: event.name,
                start: `${event.date}T${event.time}:00`,
                allDay: false,
                extendedProps: {
                  location: event.location,
                  mainContact: event.mainContact,
                  contactInfo: event.contactInfo,
                  contactPersons: event.contactPersons,
                  time: event.time,
                  originalEvent: event,
                  eventSequence: sequence,
                },
                backgroundColor:
                  event.location.toLowerCase() === "aula"
                    ? "#4ade80"
                    : "#60a5fa",
                borderColor:
                  event.location.toLowerCase() === "aula"
                    ? "#22c55e"
                    : "#3b82f6",
                textColor: "#000000",
              });
            });
          }
        } else {
          // For all-day events, create separate events for each day
          sequence.forEach((event) => {
            result.push({
              id: event.id,
              title: event.name,
              start: event.date,
              allDay: true,
              extendedProps: {
                location: event.location,
                mainContact: event.mainContact,
                contactInfo: event.contactInfo,
                contactPersons: event.contactPersons,
                time: event.time,
                originalEvent: event,
                eventSequence: sequence,
              },
              backgroundColor:
                event.location.toLowerCase() === "aula" ? "#4ade80" : "#60a5fa",
              borderColor:
                event.location.toLowerCase() === "aula" ? "#22c55e" : "#3b82f6",
              textColor: "#000000",
            });
          });
        }
      }
    }

    return result;
  }, [groupedEvents, currentView]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);

      // Adjust view based on screen size
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        if (window.innerWidth < 640 && currentView === "timeGridWeek") {
          calendarApi.changeView("listMonth");
          setCurrentView("listMonth");
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentView]);

  // Handle date selection
  const handleDateSelect = (selectInfo: any) => {
    const { start, end, allDay } = selectInfo;

    // Create an array of selected dates
    const dates: Date[] = [];
    let currentDate = new Date(start);
    const endDate = new Date(end);

    // Subtract one day from end date because FullCalendar's end date is exclusive
    endDate.setDate(endDate.getDate() - 1);

    // Add all dates between start and end to the array
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setSelectedDates(dates);

    // If dates are selected, show the dialog
    if (dates.length > 0) {
      setIsDialogOpen(true);
    }

    // Unselect the current selection
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.unselect();
    }
  };

  // Handle event click
  const handleEventClick = (clickInfo: any) => {
    const { event } = clickInfo;
    const originalEvent = event.extendedProps.originalEvent;

    // Call the parent component's event click handler
    if (onEventClick && originalEvent) {
      onEventClick(originalEvent);
    }
  };

  // Handle view change
  const handleViewChange = (info: any) => {
    setCurrentView(info.view.type);
  };

  // Handle creating events for selected dates
  const handleCreateEvents = () => {
    if (
      !newEventName ||
      selectedDates.length === 0 ||
      !onAddEvents ||
      timeError
    )
      return;

    // Format time string based on start and end times
    let timeString = "";
    if (newEventStartTime) {
      timeString = newEventStartTime;
      if (newEventEndTime) {
        timeString += `-${newEventEndTime}`;
      }
    }

    const newEvents = selectedDates.map((date, index) => ({
      id: `new-event-${Date.now()}-${index}`,
      name: newEventName,
      date: format(date, "yyyy-MM-dd"),
      time: timeString,
      location: newEventLocation,
      mainContact: newEventMainContact,
      contactInfo: newEventContactInfo,
      contactPersons: [],
    }));

    onAddEvents(newEvents, addNote ? note : undefined);

    // Reset form fields
    setNewEventName("");
    setNewEventStartTime("");
    setNewEventEndTime("");
    setNewEventLocation("Aula");
    setNewEventMainContact("");
    setNewEventContactInfo("");
    setAddNote(false);
    setNote("");
    setSelectedDates([]);
    setIsDialogOpen(false);
    setTimeError("");
  };

  // Custom event rendering for all views - only show title
  const renderEventContent = (eventInfo: any) => {
    const { event } = eventInfo;

    // Only show title in all views (hide time and location)
    return (
      <div className="fc-event-content-wrapper">
        <div className="fc-event-title-container">
          <div
            className="fc-event-title font-medium text-xs sm:text-sm"
            title={event.title}
          >
            {event.title}
          </div>
        </div>
      </div>
    );
  };

  // Calendar view options
  const calendarViews = [
    { value: "dayGridMonth", label: "Monat" },
    { value: "timeGridWeek", label: "Woche" },
    { value: "listMonth", label: "Liste" },
  ];

  return (
    <Card className="w-full h-full">
      <CardContent className="p-0">
        <div className="w-full flex flex-col sm:flex-row justify-between items-center p-4 gap-2">
          <h2 className="text-xl font-semibold">Events Calendar</h2>
          <div className="flex flex-wrap gap-2 items-center">
            {selectedDates.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDates([])}
                  className="text-xs sm:text-sm"
                >
                  Clear Selection ({selectedDates.length})
                </Button>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="text-xs sm:text-sm"
                >
                  Add Event to Selected Dates
                </Button>
              </div>
            )}

            {/* Custom view selector for smaller screens */}
            {isMobile && (
              <Tabs
                value={currentView}
                onValueChange={(value) => {
                  if (calendarRef.current) {
                    const calendarApi = calendarRef.current.getApi();
                    calendarApi.changeView(value);
                    setCurrentView(value);
                  }
                }}
                className="mt-2 sm:mt-0"
              >
                <TabsList className="grid grid-cols-3 w-full max-w-[300px]">
                  {calendarViews.map((view) => (
                    <TabsTrigger key={view.value} value={view.value}>
                      {view.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>
        </div>
        <div className="w-full h-full overflow-auto p-2">
          <FullCalendar
            ref={calendarRef}
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: isMobile ? "" : "dayGridMonth,timeGridWeek,listMonth",
            }}
            initialView={isMobile ? "listMonth" : "dayGridMonth"}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            locale={deLocale}
            events={formattedEvents()}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            height={isMobile ? "auto" : "100%"}
            contentHeight="auto"
            stickyHeaderDates={true}
            firstDay={1} // Monday as first day of week
            buttonText={{
              today: "Heute",
              month: "Monat",
              week: "Woche",
              list: "Liste",
            }}
            viewDidMount={handleViewChange}
            nowIndicator={true}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              meridiem: false,
            }}
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            allDayText="Ganztägig"
            noEventsText="Keine Veranstaltungen"
            moreLinkText="weitere"
            // Accessibility improvements
            navLinks={true}
            // Improved event display
            eventDisplay="block"
            // Better handling of overlapping events
            slotEventOverlap={false}
          />
        </div>
      </CardContent>

      {/* Dialog for creating new events */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Neue Veranstaltung für {selectedDates.length} ausgewählte Tage
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateEvents();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Startzeit</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newEventStartTime}
                  onChange={(e) => setNewEventStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Endzeit</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newEventEndTime}
                  onChange={(e) => setNewEventEndTime(e.target.value)}
                />
                {timeError && (
                  <p className="text-sm text-red-500">{timeError}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Ort</Label>
              <Input
                id="location"
                value={newEventLocation}
                onChange={(e) => setNewEventLocation(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mainContact">Ansprechperson</Label>
              <Input
                id="mainContact"
                value={newEventMainContact}
                onChange={(e) => setNewEventMainContact(e.target.value)}
                placeholder="Name der Ansprechperson"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactInfo">
                Kontaktmöglichkeit (Tel./E-Mail)
              </Label>
              <Input
                id="contactInfo"
                value={newEventContactInfo}
                onChange={(e) => setNewEventContactInfo(e.target.value)}
                placeholder="Telefonnummer oder E-Mail-Adresse"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-right">Ausgewählte Tage</Label>
              <div className="text-sm text-muted-foreground max-h-24 overflow-auto border rounded p-2">
                {selectedDates.map((date, i) => (
                  <div key={i}>
                    {format(date, "dd.MM.yyyy", { locale: de })}
                  </div>
                ))}
              </div>
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
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={
                  !newEventName || selectedDates.length === 0 || !!timeError
                }
              >
                Speichern
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
