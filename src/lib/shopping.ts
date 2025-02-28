import { supabase } from "./supabase";
import {
  ShoppingItem,
  SortOption,
  EditableShoppingItemFields,
} from "@/types/shopping";

export async function fetchShoppingItems(sortBy: SortOption = "date") {
  let query = supabase.from("shopping_items").select("*");

  switch (sortBy) {
    case "date-newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "date-oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "priority":
      query = query
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      break;
    case "price-lowest":
      query = query
        .order("price", { ascending: true, nullsLast: true })
        .order("created_at", { ascending: false });
      break;
    case "price-highest":
      query = query
        .order("price", { ascending: false, nullsLast: true })
        .order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createShoppingItem(
  item: Omit<ShoppingItem, "id" | "created_at">,
) {
  const { data, error } = await supabase
    .from("shopping_items")
    .insert(item)
    .select();
  if (error) throw error;
  return data?.[0]?.id;
}

export async function updateShoppingItem(
  itemId: string,
  updates: EditableShoppingItemFields,
) {
  const { error } = await supabase
    .from("shopping_items")
    .update(updates)
    .eq("id", itemId);
  if (error) throw error;
}

export async function deleteShoppingItem(itemId: string) {
  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("id", itemId);
  if (error) throw error;
}

export async function fetchShoppingNotes(itemId: string) {
  const { data, error } = await supabase
    .from("shopping_notes")
    .select("*")
    .eq("shopping_item_id", itemId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createShoppingNote(
  itemId: string,
  content: string,
  createdBy: string,
) {
  const { error } = await supabase.from("shopping_notes").insert({
    shopping_item_id: itemId,
    content,
    created_by: createdBy,
  });

  if (error) throw error;
}

export async function deleteShoppingNote(noteId: string) {
  const { error } = await supabase
    .from("shopping_notes")
    .delete()
    .eq("id", noteId);

  if (error) throw error;
}
