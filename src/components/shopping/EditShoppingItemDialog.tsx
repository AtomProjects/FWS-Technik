import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ShoppingItem } from "@/types/shopping";
import { useState } from "react";

interface EditShoppingItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ShoppingItem;
  onSubmit: (
    itemId: string,
    updates: {
      name: string;
      price?: number;
      link?: string;
      priority: number;
    },
  ) => void;
}

export default function EditShoppingItemDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
}: EditShoppingItemDialogProps) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price?.toString() || "");
  const [link, setLink] = useState(item.link || "");
  const [priority, setPriority] = useState(item.priority.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(item.id, {
      name,
      price: price ? parseFloat(price) : undefined,
      link: link || undefined,
      priority: parseInt(priority),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Artikel bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link">Link (optional)</Label>
            <Input
              id="link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priorität</Label>
            <Select value={priority} onValueChange={setPriority}>
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
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit">Speichern</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
