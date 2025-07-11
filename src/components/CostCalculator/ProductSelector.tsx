import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SavedProduct } from "./types";

interface ProductSelectorProps {
  onProductSelect: (product: SavedProduct | null) => void;
  selectedProductId?: string;
  placeholder?: string;
}

export const ProductSelector = ({ onProductSelect, selectedProductId, placeholder = "Selecione um produto" }: ProductSelectorProps) => {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);

  useEffect(() => {
    const loadProducts = () => {
      const saved = localStorage.getItem('savedProducts');
      if (saved) {
        setSavedProducts(JSON.parse(saved));
      }
    };

    loadProducts();
    
    // Atualizar quando houver mudanças no localStorage
    const handleStorageChange = () => {
      loadProducts();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Também escutar por mudanças customizadas
    const handleCustomChange = () => {
      loadProducts();
    };
    
    window.addEventListener('productsUpdated', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productsUpdated', handleCustomChange);
    };
  }, []);

  const handleProductChange = (productId: string) => {
    if (productId === 'none') {
      onProductSelect(null);
      return;
    }
    
    const product = savedProducts.find(p => p.id === productId);
    onProductSelect(product || null);
  };

  return (
    <div className="space-y-2">
      <Label>Produto Base</Label>
      <Select value={selectedProductId || 'none'} onValueChange={handleProductChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Novo produto (sem base)</SelectItem>
          {savedProducts.map(product => (
            <SelectItem key={product.id} value={product.id}>
              {product.productName} - {formatCurrency(product.calculation.totalCost)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};