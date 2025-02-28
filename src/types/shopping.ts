export interface ShoppingItem {
  id: string;
  name: string;
  price?: number;
  link?: string;
  priority: number;
  created_by: string;
  created_at: string;
}

export type SortOption =
  | "date-newest"
  | "date-oldest"
  | "price-lowest"
  | "price-highest"
  | "priority"
  | "date";

export type EditableShoppingItemFields = Pick<
  ShoppingItem,
  "name" | "price" | "link" | "priority"
>;
