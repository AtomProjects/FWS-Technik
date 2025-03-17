export interface Event {
  id: string;
  name: string;
  date: string;
  time?: string;
  location: string;
  contactPersons: string[];
  mainContact?: string;
  contactInfo?: string;
}
