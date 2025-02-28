import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Edit,
  Search,
  SlidersHorizontal,
  Minus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";

interface InventoryItem {
  id: string;
  name?: string;
  category: string;
  cable_type?: string;
  cable_length?: number;
  has_dmx?: boolean;
  is_functional?: boolean;
  has_tuv?: boolean;
  marking: string;
  location: string;
  created_by: string;
  created_at: string;
}

type SortOption = "marking" | "category" | "date";

const CATEGORIES = [
  "Scheinwerfer",
  "Andere Bühnentechnik",
  "Kabel",
  "Stative etc.",
  "Tontechnik",
  "Digitales",
  "Sonstiges",
];

const CABLE_TYPES = ["Schuko", "DMX", "XLR", "Sonstige"];

const LOCATIONS = ["Keller", "unter der Steuerzentrale", "unter der Bühne"];

export default function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] =
    useState<InventoryItem | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [showFilters, setShowFilters] = useState(false);
  const [showDefective, setShowDefective] = useState(false);
  const [showWithoutTUV, setShowWithoutTUV] = useState(false);

  // Form states
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemCableType, setNewItemCableType] = useState("");
  const [newItemCableLength, setNewItemCableLength] = useState<
    number | undefined
  >();
  const [newItemHasDMX, setNewItemHasDMX] = useState(false);
  const [newItemIsFunctional, setNewItemIsFunctional] = useState(true);
  const [newItemHasTUV, setNewItemHasTUV] = useState(false);
  const [newItemMarking, setNewItemMarking] = useState("WS VT ");
  const [newItemLocation, setNewItemLocation] = useState("");
  const [itemCount, setItemCount] = useState(1);
  const [markingError, setMarkingError] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [
    items,
    searchQuery,
    selectedCategories,
    sortBy,
    showDefective,
    showWithoutTUV,
  ]);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase.from("inventory").select("*");

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Inventarliste konnte nicht geladen werden.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if marking already exists
  const checkMarkingExists = async (
    marking: string,
    excludeId?: string,
  ): Promise<boolean> => {
    let query = supabase.from("inventory").select("id").eq("marking", marking);

    // If we're editing an item, exclude the current item from the check
    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error checking marking:", error);
      return false;
    }

    return data && data.length > 0;
  };

  // Find the next available marking number
  const findNextAvailableMarking = async (
    baseMarking: string,
  ): Promise<string> => {
    // Get all items with markings that start with the base marking
    const { data, error } = await supabase
      .from("inventory")
      .select("marking")
      .ilike("marking", `${baseMarking}%`);

    if (error) {
      console.error("Error finding next available marking:", error);
      return `${baseMarking}1`;
    }

    if (!data || data.length === 0) {
      return `${baseMarking}1`;
    }

    // Extract numbers from markings and find the highest one
    const numbers = data
      .map((item) => {
        const match = item.marking.match(/(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((num) => !isNaN(num));

    if (numbers.length === 0) {
      return `${baseMarking}1`;
    }

    const maxNumber = Math.max(...numbers);
    return `${baseMarking}${maxNumber + 1}`;
  };

  // Check marking availability in real-time
  const validateMarking = async (marking: string) => {
    if (!marking) {
      setMarkingError("");
      return;
    }

    const exists = await checkMarkingExists(marking);
    if (exists) {
      setMarkingError("Diese Kennzeichnung existiert bereits.");
    } else {
      setMarkingError("");
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...items];

    // Apply category filter
    if (selectedCategories.length > 0) {
      result = result.filter((item) =>
        selectedCategories.includes(item.category),
      );
    }

    // Apply defective filter
    if (showDefective) {
      result = result.filter((item) => item.is_functional === false);
    }

    // Apply without TÜV filter
    if (showWithoutTUV) {
      result = result.filter((item) => !item.has_tuv);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => {
        return (
          item.name?.toLowerCase()?.includes(query) ||
          false ||
          item.category.toLowerCase().includes(query) ||
          item.cable_type?.toLowerCase()?.includes(query) ||
          false ||
          item.marking.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "marking":
        // Sort by marking numerically if possible
        result.sort((a, b) => {
          // Extract numbers from markings if they exist
          const aMatch = a.marking.match(/(\d+)$/);
          const bMatch = b.marking.match(/(\d+)$/);

          if (aMatch && bMatch) {
            // If both have numbers at the end, sort numerically
            const aNum = parseInt(aMatch[1]);
            const bNum = parseInt(bMatch[1]);
            return aNum - bNum;
          } else {
            // Otherwise sort alphabetically
            return a.marking.localeCompare(b.marking);
          }
        });
        break;
      case "category":
        result.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case "date":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
    }

    setFilteredItems(result);
  };

  const resetForm = () => {
    setNewItemName("");
    setNewItemCategory("");
    setNewItemCableType("");
    setNewItemCableLength(undefined);
    setNewItemHasDMX(false);
    setNewItemIsFunctional(true);
    setNewItemHasTUV(false);
    setNewItemMarking("WS VT ");
    setNewItemLocation("");
    setItemCount(1);
    setMarkingError("");
  };

  // Update marking when category changes
  useEffect(() => {
    if (newItemCategory) {
      const updateMarking = async () => {
        const baseMarking = "WS VT ";
        const nextMarking = await findNextAvailableMarking(baseMarking);
        setNewItemMarking(nextMarking);
      };
      updateMarking();
    }
  }, [newItemCategory]);

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form
    if (newItemCategory === "") {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Bitte wählen Sie eine Kategorie aus.",
      });
      return;
    }

    if (newItemCategory !== "Kabel" && !newItemName) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Bitte geben Sie einen Namen ein.",
      });
      return;
    }

    if (newItemCategory === "Kabel" && !newItemCableType) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Bitte wählen Sie einen Kabeltyp aus.",
      });
      return;
    }

    if (!newItemLocation) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Bitte wählen Sie einen Standort aus.",
      });
      return;
    }

    // Check if marking already exists for the first item
    const markingExists = await checkMarkingExists(newItemMarking);
    if (markingExists) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description:
          "Diese Kennzeichnung existiert bereits. Bitte wählen Sie eine andere.",
      });
      return;
    }

    try {
      // For multiple items, we need to create an array of items with sequential markings
      const itemsToCreate = [];
      let currentMarking = newItemMarking;

      // Extract the base and number part of the marking
      const match = newItemMarking.match(/(.*)?(\d+)$/);
      let baseMarking = "WS VT ";
      let currentNumber = 1;

      if (match) {
        baseMarking = match[1] || "";
        currentNumber = parseInt(match[2]);
      }

      for (let i = 0; i < itemCount; i++) {
        // For the first item, use the provided marking
        // For subsequent items, increment the number
        if (i > 0) {
          currentMarking = `${baseMarking}${currentNumber + i}`;

          // Check if this marking exists
          const exists = await checkMarkingExists(currentMarking);
          if (exists) {
            // Find the next available marking
            currentMarking = await findNextAvailableMarking(baseMarking);
            // Update the base and number for subsequent items
            const newMatch = currentMarking.match(/(.*)?(\d+)$/);
            if (newMatch) {
              baseMarking = newMatch[1] || "";
              currentNumber = parseInt(newMatch[2]);
            }
          }
        }

        itemsToCreate.push({
          name: newItemName || null,
          category: newItemCategory,
          cable_type: newItemCategory === "Kabel" ? newItemCableType : null,
          cable_length: newItemCategory === "Kabel" ? newItemCableLength : null,
          has_dmx:
            newItemCategory === "Scheinwerfer" ||
            newItemCategory === "Andere Bühnentechnik"
              ? newItemHasDMX
              : null,
          is_functional: newItemIsFunctional,
          has_tuv: newItemHasTUV,
          marking: currentMarking,
          location: newItemLocation,
          created_by: user.username,
        });
      }

      const { error } = await supabase.from("inventory").insert(itemsToCreate);

      if (error) throw error;

      await loadItems();
      resetForm();
      setIsAddDialogOpen(false);
      toast({
        title: "Erfolg",
        description:
          itemCount > 1
            ? `${itemCount} Geräte wurden erfolgreich hinzugefügt.`
            : "Das Gerät wurde erfolgreich hinzugefügt.",
      });
    } catch (error) {
      console.error("Error adding item(s):", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Das Gerät konnte nicht hinzugefügt werden.",
      });
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForEdit || !user) return;

    // Validate form
    if (newItemCategory === "") {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Bitte wählen Sie eine Kategorie aus.",
      });
      return;
    }

    if (newItemCategory !== "Kabel" && !newItemName) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Bitte geben Sie einen Namen ein.",
      });
      return;
    }

    if (newItemCategory === "Kabel" && !newItemCableType) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Bitte wählen Sie einen Kabeltyp aus.",
      });
      return;
    }

    if (!newItemLocation) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Bitte wählen Sie einen Standort aus.",
      });
      return;
    }

    // Check if marking already exists (excluding the current item)
    if (newItemMarking !== selectedItemForEdit.marking) {
      const markingExists = await checkMarkingExists(
        newItemMarking,
        selectedItemForEdit.id,
      );
      if (markingExists) {
        toast({
          variant: "destructive",
          title: "Fehler",
          description:
            "Diese Kennzeichnung existiert bereits. Bitte wählen Sie eine andere.",
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from("inventory")
        .update({
          name: newItemName || null,
          category: newItemCategory,
          cable_type: newItemCategory === "Kabel" ? newItemCableType : null,
          cable_length: newItemCategory === "Kabel" ? newItemCableLength : null,
          has_dmx:
            newItemCategory === "Scheinwerfer" ||
            newItemCategory === "Andere Bühnentechnik"
              ? newItemHasDMX
              : null,
          is_functional: newItemIsFunctional,
          has_tuv: newItemHasTUV,
          marking: newItemMarking,
          location: newItemLocation,
        })
        .eq("id", selectedItemForEdit.id);

      if (error) throw error;

      await loadItems();
      resetForm();
      setSelectedItemForEdit(null);
      toast({
        title: "Erfolg",
        description: "Das Gerät wurde erfolgreich aktualisiert.",
      });
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Das Gerät konnte nicht aktualisiert werden.",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      await loadItems();
      toast({
        title: "Erfolg",
        description: "Das Gerät wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Das Gerät konnte nicht gelöscht werden.",
      });
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItemForEdit(item);
    setNewItemName(item.name || "");
    setNewItemCategory(item.category);
    setNewItemCableType(item.cable_type || "");
    setNewItemCableLength(item.cable_length);
    setNewItemHasDMX(item.has_dmx || false);
    setNewItemIsFunctional(item.is_functional !== false);
    setNewItemHasTUV(item.has_tuv || false);
    setNewItemMarking(item.marking);
    setNewItemLocation(item.location);
  };

  const getCategoryDisplay = (item: InventoryItem) => {
    if (item.category === "Kabel" && item.cable_type) {
      return `${item.cable_type} Kabel`;
    }
    return item.category;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <p>Lade Inventar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <Card className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
          <h1 className="text-3xl font-bold">Lager</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Gerät hinzufügen
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 sm:flex-auto"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sortieren nach" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marking">Kennzeichnung</SelectItem>
                  <SelectItem value="category">Kategorie</SelectItem>
                  <SelectItem value="date">Datum hinzugefügt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showFilters && (
            <div className="p-4 border rounded-md bg-muted/50 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Kategorien</h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <Button
                      key={category}
                      variant={
                        selectedCategories.includes(category)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleCategoryFilter(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Status</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={showDefective ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowDefective(!showDefective)}
                  >
                    Defekt
                  </Button>
                  <Button
                    variant={showWithoutTUV ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowWithoutTUV(!showWithoutTUV)}
                  >
                    Ohne TÜV
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start sm:items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors overflow-hidden"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    {item.category === "Kabel" && item.cable_type
                      ? `${item.cable_type} Kabel`
                      : item.name}
                    {item.is_functional === false && (
                      <span className="ml-2 text-destructive">(Defekt)</span>
                    )}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground pr-2">
                  <p className="truncate md:block">
                    <span className="inline md:hidden" title="Kategorie">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="inline-block h-4 w-4 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="7" height="7" x="3" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="14" rx="1" />
                        <rect width="7" height="7" x="3" y="14" rx="1" />
                      </svg>
                    </span>
                    <span className="hidden md:inline">Kategorie: </span>
                    {getCategoryDisplay(item)}
                  </p>
                  <p className="truncate">
                    <span className="inline md:hidden" title="Standort">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="inline-block h-4 w-4 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <span className="hidden md:inline">Standort: </span>
                    {item.location}
                  </p>
                  <p className="truncate">
                    <span className="inline md:hidden" title="Kennzeichnung">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="inline-block h-4 w-4 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 7V4h16v3" />
                        <path d="M9 20h6" />
                        <path d="M12 4v16" />
                      </svg>
                    </span>
                    <span className="hidden md:inline">Kennzeichnung: </span>
                    {item.marking}
                  </p>
                  {item.category === "Kabel" && item.cable_length && (
                    <p className="truncate">
                      <span className="inline md:hidden" title="Länge">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="inline-block h-4 w-4 mr-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                      </span>
                      <span className="hidden md:inline">Länge: </span>
                      {item.cable_length}m
                    </p>
                  )}
                  {(item.category === "Scheinwerfer" ||
                    item.category === "Andere Bühnentechnik") && (
                    <p className="truncate">
                      <span className="inline md:hidden" title="DMX">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="inline-block h-4 w-4 mr-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </span>
                      <span className="hidden md:inline">DMX: </span>
                      {item.has_dmx ? "Ja" : "Nein"}
                    </p>
                  )}
                  <p className="truncate">
                    <span className="inline md:hidden" title="Funktioniert">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="inline-block h-4 w-4 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </span>
                    <span className="hidden md:inline">Funktioniert: </span>
                    {item.is_functional !== false ? "Ja" : "Nein"}
                  </p>
                  {item.category !== "Stative etc." &&
                    item.category !== "Digitales" && (
                      <p className="truncate">
                        <span className="inline md:hidden" title="TÜV">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="inline-block h-4 w-4 mr-1"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </span>
                        <span className="hidden md:inline">TÜV: </span>
                        {item.has_tuv ? "Ja" : "Nein"}
                      </p>
                    )}
                  <p className="truncate">
                    <span className="inline md:hidden" title="Hinzugefügt">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="inline-block h-4 w-4 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </span>
                    <span className="hidden md:inline">Hinzugefügt: </span>
                    {new Date(item.created_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(item)}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-destructive hover:text-destructive h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {items.length === 0
                ? "Noch keine Geräte im Inventar"
                : "Keine Geräte gefunden, die den Filterkriterien entsprechen"}
            </p>
          )}
        </div>

        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="max-w-[95vw] sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerät hinzufügen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie *</Label>
                <Select
                  value={newItemCategory}
                  onValueChange={setNewItemCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle eine Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(newItemCategory !== "Kabel" || !newItemCategory) && (
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name {newItemCategory !== "Kabel" && "*"}
                  </Label>
                  <Input
                    id="name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required={newItemCategory !== "Kabel"}
                  />
                </div>
              )}

              {newItemCategory === "Kabel" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cableType">Kabeltyp *</Label>
                    <Select
                      value={newItemCableType}
                      onValueChange={setNewItemCableType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wähle einen Kabeltyp" />
                      </SelectTrigger>
                      <SelectContent>
                        {CABLE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cableLength">Länge (in Meter)</Label>
                    <Input
                      id="cableLength"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newItemCableLength || ""}
                      onChange={(e) =>
                        setNewItemCableLength(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        )
                      }
                    />
                  </div>
                </>
              )}

              {(newItemCategory === "Scheinwerfer" ||
                newItemCategory === "Andere Bühnentechnik") && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasDMX"
                    checked={newItemHasDMX}
                    onCheckedChange={(checked) =>
                      setNewItemHasDMX(checked as boolean)
                    }
                  />
                  <Label htmlFor="hasDMX">DMX</Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFunctional"
                  checked={newItemIsFunctional}
                  onCheckedChange={(checked) =>
                    setNewItemIsFunctional(checked as boolean)
                  }
                />
                <Label htmlFor="isFunctional">Funktioniert</Label>
              </div>

              {newItemCategory !== "Stative etc." &&
                newItemCategory !== "Digitales" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasTUV"
                      checked={newItemHasTUV}
                      onCheckedChange={(checked) =>
                        setNewItemHasTUV(checked as boolean)
                      }
                    />
                    <Label htmlFor="hasTUV">TÜV</Label>
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="marking">Kennzeichnung *</Label>
                <Input
                  id="marking"
                  value={newItemMarking}
                  onChange={(e) => {
                    setNewItemMarking(e.target.value);
                    validateMarking(e.target.value);
                  }}
                  required
                  className={markingError ? "border-destructive" : ""}
                />
                {markingError && (
                  <p className="text-sm text-destructive">{markingError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemCount">Anzahl</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setItemCount(Math.max(1, itemCount - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="itemCount"
                    type="number"
                    min="1"
                    max="50"
                    value={itemCount}
                    onChange={(e) =>
                      setItemCount(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setItemCount(Math.min(50, itemCount + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {itemCount > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Es werden {itemCount} identische Geräte mit fortlaufenden
                    Kennzeichnungen erstellt.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Standort *</Label>
                <Select
                  value={newItemLocation}
                  onValueChange={setNewItemLocation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle einen Standort" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                  className="w-full sm:w-auto"
                >
                  Abbrechen
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  Hinzufügen
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!selectedItemForEdit}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedItemForEdit(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-[95vw] sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerät bearbeiten</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditItem} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie *</Label>
                <Select
                  value={newItemCategory}
                  onValueChange={setNewItemCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle eine Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(newItemCategory !== "Kabel" || !newItemCategory) && (
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name {newItemCategory !== "Kabel" && "*"}
                  </Label>
                  <Input
                    id="name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required={newItemCategory !== "Kabel"}
                  />
                </div>
              )}

              {newItemCategory === "Kabel" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cableType">Kabeltyp *</Label>
                    <Select
                      value={newItemCableType}
                      onValueChange={setNewItemCableType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wähle einen Kabeltyp" />
                      </SelectTrigger>
                      <SelectContent>
                        {CABLE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cableLength">Länge (in Meter)</Label>
                    <Input
                      id="cableLength"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newItemCableLength || ""}
                      onChange={(e) =>
                        setNewItemCableLength(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        )
                      }
                    />
                  </div>
                </>
              )}

              {(newItemCategory === "Scheinwerfer" ||
                newItemCategory === "Andere Bühnentechnik") && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasDMX"
                    checked={newItemHasDMX}
                    onCheckedChange={(checked) =>
                      setNewItemHasDMX(checked as boolean)
                    }
                  />
                  <Label htmlFor="hasDMX">DMX</Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFunctional"
                  checked={newItemIsFunctional}
                  onCheckedChange={(checked) =>
                    setNewItemIsFunctional(checked as boolean)
                  }
                />
                <Label htmlFor="isFunctional">Funktioniert</Label>
              </div>

              {newItemCategory !== "Stative etc." &&
                newItemCategory !== "Digitales" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasTUV"
                      checked={newItemHasTUV}
                      onCheckedChange={(checked) =>
                        setNewItemHasTUV(checked as boolean)
                      }
                    />
                    <Label htmlFor="hasTUV">TÜV</Label>
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="marking">Kennzeichnung *</Label>
                <Input
                  id="marking"
                  value={newItemMarking}
                  onChange={(e) => {
                    setNewItemMarking(e.target.value);
                    validateMarking(e.target.value);
                  }}
                  required
                  className={markingError ? "border-destructive" : ""}
                />
                {markingError && (
                  <p className="text-sm text-destructive">{markingError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Standort *</Label>
                <Select
                  value={newItemLocation}
                  onValueChange={setNewItemLocation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle einen Standort" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedItemForEdit(null);
                    resetForm();
                  }}
                  className="w-full sm:w-auto"
                >
                  Abbrechen
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  Speichern
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}
