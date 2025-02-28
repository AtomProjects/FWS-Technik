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
import { Plus, Trash2, ExternalLink, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchShoppingItems,
  createShoppingItem,
  deleteShoppingItem,
  updateShoppingItem,
} from "@/lib/shopping";
import { ShoppingItem, SortOption } from "@/types/shopping";
import ShoppingNotesDialog from "./ShoppingNotesDialog";
import EditShoppingItemDialog from "./EditShoppingItemDialog";

const PRIORITY_LABELS: Record<number, { label: string; class: string }> = {
  0: { label: "Niedrig", class: "text-muted-foreground" },
  1: { label: "Mittel", class: "text-primary" },
  2: { label: "Hoch", class: "text-destructive font-medium" },
};

export default function ShoppingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedItemForNotes, setSelectedItemForNotes] =
    useState<ShoppingItem | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] =
    useState<ShoppingItem | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date-newest");

  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemLink, setNewItemLink] = useState("");
  const [newItemPriority, setNewItemPriority] = useState("0");

  useEffect(() => {
    loadItems();
  }, [sortBy]);

  const loadItems = async () => {
    try {
      const data = await fetchShoppingItems(sortBy);
      setItems(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Einkaufsliste konnte nicht geladen werden.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createShoppingItem({
        name: newItemName,
        price: newItemPrice ? parseFloat(newItemPrice) : undefined,
        link: newItemLink || undefined,
        priority: parseInt(newItemPriority),
        created_by: user.username,
      });
      await loadItems();
      setIsAddDialogOpen(false);
      setNewItemName("");
      setNewItemPrice("");
      setNewItemLink("");
      setNewItemPriority("0");
      toast({
        title: "Erfolg",
        description: "Der Artikel wurde erfolgreich hinzugefügt.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Der Artikel konnte nicht hinzugefügt werden.",
      });
    }
  };

  const handleEditItem = async (
    itemId: string,
    updates: {
      name: string;
      price?: number;
      link?: string;
      priority: number;
    },
  ) => {
    try {
      await updateShoppingItem(itemId, updates);
      await loadItems();
      setSelectedItemForEdit(null);
      toast({
        title: "Erfolg",
        description: "Der Artikel wurde erfolgreich aktualisiert.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Der Artikel konnte nicht aktualisiert werden.",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteShoppingItem(itemId);
      await loadItems();
      toast({
        title: "Erfolg",
        description: "Der Artikel wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Der Artikel konnte nicht gelöscht werden.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <p>Lade Einkaufsliste...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <Card className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
          <h1 className="text-3xl font-bold">Einkaufsliste</h1>
          <div className="flex gap-2">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sortieren nach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priorität</SelectItem>
                <SelectItem value="date-newest">
                  Datum: Neueste zuerst
                </SelectItem>
                <SelectItem value="date-oldest">
                  Datum: Älteste zuerst
                </SelectItem>
                <SelectItem value="price-lowest">
                  Preis: Niedrigste zuerst
                </SelectItem>
                <SelectItem value="price-highest">
                  Preis: Höchste zuerst
                </SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Artikel hinzufügen
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setSelectedItemForNotes(item)}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{item.name}</h3>
                  <span className={PRIORITY_LABELS[item.priority].class}>
                    ({PRIORITY_LABELS[item.priority].label})
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Hinzugefügt von {item.created_by} am{" "}
                  {new Date(item.created_at).toLocaleDateString("de-DE")}
                </p>
              </div>
              <div
                className="flex items-center gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                {item.price && (
                  <span className="text-sm font-medium">
                    {item.price.toFixed(2)} €
                  </span>
                )}
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedItemForEdit(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Noch keine Artikel in der Einkaufsliste
            </p>
          )}
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Artikel hinzufügen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Preis (optional)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Link (optional)</Label>
                <Input
                  id="link"
                  type="url"
                  value={newItemLink}
                  onChange={(e) => setNewItemLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorität</Label>
                <Select
                  value={newItemPriority}
                  onValueChange={setNewItemPriority}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle eine Priorität" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Niedrig</SelectItem>
                    <SelectItem value="1">Mittel</SelectItem>
                    <SelectItem value="2">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button type="submit">Hinzufügen</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {selectedItemForNotes && (
          <ShoppingNotesDialog
            open={!!selectedItemForNotes}
            onOpenChange={(open) => !open && setSelectedItemForNotes(null)}
            item={selectedItemForNotes}
          />
        )}

        {selectedItemForEdit && (
          <EditShoppingItemDialog
            open={!!selectedItemForEdit}
            onOpenChange={(open) => !open && setSelectedItemForEdit(null)}
            item={selectedItemForEdit}
            onSubmit={handleEditItem}
          />
        )}
      </Card>
    </div>
  );
}
