import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  cost: number;
  margin: number;
  salePrice: number;
  profit: number;
}

export const ProductCostTable = () => {
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Produto A",
      cost: 50.00,
      margin: 40,
      salePrice: 70.00,
      profit: 20.00
    },
    {
      id: "2", 
      name: "Produto B",
      cost: 100.00,
      margin: 30,
      salePrice: 130.00,
      profit: 30.00
    },
    {
      id: "3",
      name: "Produto C", 
      cost: 25.00,
      margin: 60,
      salePrice: 40.00,
      profit: 15.00
    }
  ]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    cost: 0,
    margin: 0
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const calculateSalePrice = (cost: number, margin: number) => {
    return cost * (1 + margin / 100);
  };

  const calculateProfit = (salePrice: number, cost: number) => {
    return salePrice - cost;
  };

  const addProduct = () => {
    if (!newProduct.name || newProduct.cost <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos corretamente",
        variant: "destructive"
      });
      return;
    }

    const salePrice = calculateSalePrice(newProduct.cost, newProduct.margin);
    const profit = calculateProfit(salePrice, newProduct.cost);

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name,
      cost: newProduct.cost,
      margin: newProduct.margin,
      salePrice,
      profit
    };

    setProducts([...products, product]);
    setNewProduct({ name: "", cost: 0, margin: 0 });
    
    toast({
      title: "Sucesso",
      description: "Produto adicionado com sucesso!",
    });
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast({
      title: "Produto removido",
      description: "Produto excluído da tabela",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <CardTitle className="text-2xl font-bold">Tabela de Custo de Produtos</CardTitle>
        </CardHeader>
      </Card>

      {/* Add Product Form */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Novo Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Nome do produto"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Custo (R$)"
              value={newProduct.cost || ""}
              onChange={(e) => setNewProduct({ ...newProduct, cost: parseFloat(e.target.value) || 0 })}
            />
            <Input
              type="number"
              placeholder="Margem (%)"
              value={newProduct.margin || ""}
              onChange={(e) => setNewProduct({ ...newProduct, margin: parseFloat(e.target.value) || 0 })}
            />
            <Button onClick={addProduct} className="bg-gradient-primary hover:opacity-90 transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Produto</TableHead>
                  <TableHead className="font-semibold">Custo</TableHead>
                  <TableHead className="font-semibold">Margem (%)</TableHead>
                  <TableHead className="font-semibold">Preço de Venda</TableHead>
                  <TableHead className="font-semibold">Lucro</TableHead>
                  <TableHead className="font-semibold text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow 
                    key={product.id} 
                    className="hover:bg-muted/30 transition-colors duration-200"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{formatCurrency(product.cost)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {product.margin}%
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(product.salePrice)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.profit > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {formatCurrency(product.profit)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(product.id)}
                          className="hover:bg-primary/10"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-subtle rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {products.length}
              </div>
              <div className="text-sm text-muted-foreground">Total de Produtos</div>
            </div>
            <div className="text-center p-4 bg-gradient-subtle rounded-lg">
              <div className="text-2xl font-bold text-success">
                {formatCurrency(products.reduce((sum, p) => sum + p.profit, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Lucro Total</div>
            </div>
            <div className="text-center p-4 bg-gradient-subtle rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(products.reduce((sum, p) => sum + p.salePrice, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Valor Total de Venda</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};