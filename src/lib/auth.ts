import { supabase } from "./supabase";
import { User } from "@/types/auth";

export async function loginUser(
  username: string,
  password: string,
): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Invalid credentials");

  return {
    id: data.id,
    username: data.username,
    isTeacher: data.is_teacher,
  };
}

export async function createUser(
  username: string,
  password: string,
  isTeacher: boolean = false,
): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .insert({
      username,
      password,
      is_teacher: isTeacher,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create user");

  return {
    id: data.id,
    username: data.username,
    isTeacher: data.is_teacher,
  };
}

export async function validateUsername(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .select("username")
    .eq("username", username)
    .single();

  if (error) return true; // Username is available
  return !data; // Username is taken if data exists
}
