export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  contactPersons: string[];
  mainContact?: string;
  contactInfo?: string;
}
