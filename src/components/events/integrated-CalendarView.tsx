import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Event } from "@/types/events";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import FullCalendar and required plugins
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import deLocale from '@fullcalendar/core/locales/de';

// Import CSS
import './calendar-styles.css';

interface CalendarViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  onAddEvents?: (events: Event[], initialNote?: string) => void;
}

export default function CalendarView({ events, onEventClick, onAddEvents }: CalendarViewProps) {
  // State for selected dates and dialog
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // State for new event form
  const [newEventName, setNewEventName] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("Aula");
  const [newEventMainContact, setNewEventMainContact] = useState("");
  const [newEventContactInfo, setNewEventContactInfo] = useState("");
  const [addNote, setAddNote] = useState(false);
  const [note, setNote] = useState("");
  
  // State for calendar view
  const [currentView, setCurrentView] = useState("dayGridMonth");
  
  // Reference to the calendar API
  const calendarRef = useRef<any>(null);
  
  // State for responsive design
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 640;

  // Format events for FullCalendar
  const formattedEvents = useCallback(() => {
    return events.map(event => {
      // Check if this is part of a multi-day event
      const sameNameLocationEvents = events.filter(e => 
        e.name === event.name && 
        e.location === event.location &&
        e.id !== event.id
      );
      
      // Sort by date to find consecutive dates
      sameNameLocationEvents.sort((a, b) => a.date.localeCompare(b.date));
      
      // Find if this event is part of a consecutive sequence
      const isPartOfMultiDay = sameNameLocationEvents.some(e => {
        const currentDate = new Date(event.date);
        const otherDate = new Date(e.date);
        
        // Check if dates are consecutive (1 day apart)
        const diffTime = Math.abs(currentDate.getTime() - otherDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays === 1;
      });
      
      // If part of multi-day, find the start and end dates
      let startDate = event.date;
      let endDate = event.date;
      
      if (isPartOfMultiDay) {
        // Find all consecutive events with same name and location
        const allRelatedEvents = [event, ...sameNameLocationEvents];
        allRelatedEvents.sort((a, b) => a.date.localeCompare(b.date));
        
        // Find consecutive sequences
        let currentSequence = [allRelatedEvents[0]];
        const sequences = [currentSequence];
        
        for (let i = 1; i < allRelatedEvents.length; i++) {
          const currentEvent = allRelatedEvents[i];
          const prevEvent = allRelatedEvents[i-1];
          
          const currentDate = new Date(currentEvent.date);
          const prevDate = new Date(prevEvent.date);
          
          // Check if dates are consecutive
          const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // Add to current sequence
            currentSequence.push(currentEvent);
          } else {
            // Start a new sequence
            currentSequence = [currentEvent];
            sequences.push(currentSequence);
          }
        }
        
        // Find which sequence contains our event
        const eventSequence = sequences.find(seq => seq.some(e => e.id === event.id));
        
        if (eventSequence) {
          startDate = eventSequence[0].date;
          endDate = eventSequence[eventSequence.length - 1].date;
          
          // For FullCalendar, end date is exclusive, so add one day
          const exclusiveEndDate = new Date(endDate);
          exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);
          endDate = format(exclusiveEndDate, "yyyy-MM-dd");
        }
      }
      
      return {
        id: event.id,
        title: event.name,
        start: startDate,
        end: endDate !== startDate ? endDate : undefined, // Only set end if it's different from start
        allDay: !event.time,
        extendedProps: {
          location: event.location,
          mainContact: event.mainContact,
          contactInfo: event.contactInfo,
          contactPersons: event.contactPersons,
          time: event.time,
          originalEvent: event // Store the original event for reference
        },
        backgroundColor: event.location.toLowerCase() === "aula" ? "#4ade80" : "#60a5fa",
        borderColor: event.location.toLowerCase() === "aula" ? "#22c55e" : "#3b82f6",
        textColor: "#000000" // Black text for better readability
      };
    });
  }, [events]);

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
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    if (!newEventName || selectedDates.length === 0 || !onAddEvents) return;
    
    const newEvents = selectedDates.map((date, index) => ({
      id: `new-event-${Date.now()}-${index}`,
      name: newEventName,
      date: format(date, "yyyy-MM-dd"),
      time: newEventTime,
      location: newEventLocation,
      mainContact: newEventMainContact,
      contactInfo: newEventContactInfo,
      contactPersons: []
    }));
    
    onAddEvents(newEvents, addNote ? note : undefined);
    
    // Reset form fields
    setNewEventName("");
    setNewEventTime("");
    setNewEventLocation("Aula");
    setNewEventMainContact("");
    setNewEventContactInfo("");
    setAddNote(false);
    setNote("");
    setSelectedDates([]);
    setIsDialogOpen(false);
  };

  // Custom event rendering
  const renderEventContent = (eventInfo: any) => {
    const { event } = eventInfo;
    const { extendedProps } = event;
    
    return (
      <div className="fc-event-content-wrapper">
        <div className="fc-event-title-container">
          <div className="fc-event-title font-medium text-xs sm:text-sm" title={event.title}>
            {event.title}
          </div>
        </div>
        {extendedProps.time && (
          <div className="fc-event-time text-xs">
            {extendedProps.time} Uhr
          </div>
        )}
        <div className="fc-event-location text-xs opacity-80">
          {extendedProps.location}
        </div>
      </div>
    );
  };

  // Calendar view options
  const calendarViews = [
    { value: "dayGridMonth", label: "Monat" },
    { value: "timeGridWeek", label: "Woche" },
    { value: "listMonth", label: "Liste" }
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
                  {calendarViews.map(view => (
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
              listPlugin
            ]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: isMobile ? '' : 'dayGridMonth,timeGridWeek,listMonth'
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
              today: 'Heute',
              month: 'Monat',
              week: 'Woche',
              list: 'Liste'
            }}
            viewDidMount={handleViewChange}
            nowIndicator={true}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
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
            <DialogTitle>Neue Veranstaltung für {selectedDates.length} ausgewählte Tage</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateEvents(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Uhrzeit</Label>
              <Input
                id="time"
                type="time"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
              />
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
                  <div key={i}>{format(date, "dd.MM.yyyy", { locale: de })}</div>
                ))}
              </div>
            </div>
            <div className=<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>