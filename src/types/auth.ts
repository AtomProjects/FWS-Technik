export interface User {
  id: string;
  username: string;
  isTeacher: boolean;
}

export interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}
