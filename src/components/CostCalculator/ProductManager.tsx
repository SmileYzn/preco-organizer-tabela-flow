import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Package, Search, FileSpreadsheet } from "lucide-react";
import { SavedProduct, GlobalSettings } from "./types";
import { toast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface ProductManagerProps {
  globalSettings: GlobalSettings;
}

export const ProductManager = ({ globalSettings }: ProductManagerProps) => {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<SavedProduct | null>(null);

  useEffect(() => {
    loadSavedProducts();
  }, []);

  const loadSavedProducts = () => {
    const saved = localStorage.getItem('savedProducts');
    if (saved) {
      setSavedProducts(JSON.parse(saved));
    }
  };

  const deleteProduct = (id: string) => {
    const updated = savedProducts.filter(p => p.id !== id);
    setSavedProducts(updated);
    localStorage.setItem('savedProducts', JSON.stringify(updated));
    
    toast({
      title: "Produto excluído",
      description: "Produto removido com sucesso!",
    });
  };

  const filteredProducts = savedProducts.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const exportToExcel = () => {
    if (savedProducts.length === 0) {
      toast({
        title: "Nenhum produto para exportar",
        description: "Adicione produtos antes de exportar.",
        variant: "destructive"
      });
      return;
    }

    const workbook = XLSX.utils.book_new();

    // Aba de Configurações Globais
    const configData = [
      ['Configuração', 'Valor'],
      ['Taxa de Mão de Obra (R$/h)', globalSettings.laborRate],
      ['Depreciação Laser (R$/h)', globalSettings.laserDepreciationRate],
      ['Custos Fixos Mensais (R$)', globalSettings.monthlyFixedCosts],
      ['Produção Mensal Estimada', globalSettings.monthlyProduction],
      ['Regime Tributário', globalSettings.taxRegime],
      ['ICMS (%)', globalSettings.icmsRate],
      ['PIS (%)', globalSettings.pisRate],
      ['COFINS (%)', globalSettings.cofinsRate],
      ['Comissão (%)', globalSettings.commissionRate],
      ['Frete de Venda (%)', globalSettings.freightRate],
      ['Data da Exportação', new Date().toLocaleDateString('pt-BR')]
    ];
    
    const configSheet = XLSX.utils.aoa_to_sheet(configData);
    XLSX.utils.book_append_sheet(workbook, configSheet, 'Configuracoes_Globais');

    // Aba de Produtos Consolidados
    const productsData = [
      ['Nome do Produto', 'Tipo', 'Descrição', 'Custo Total (R$)', 'Preço Mínimo (R$)', 'Data Criação', 'Última Atualização']
    ];

    savedProducts.forEach(product => {
      const calc = product.calculation;
     productsData.push([
        product.productName,
        product.type === 'ring' ? 'Anilha' : 'Brinde',
        product.description,
        calc.totalCost.toFixed(2),
        calc.minimumPrice.toFixed(2),
        formatDate(product.createdAt),
        formatDate(product.updatedAt)
      ]);
    });

    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produtos_Consolidado');

    // Aba de Anilhas Detalhadas
    const ringsData = [
      ['Nome', 'Descrição', 'Custo Materiais', 'Custo Terceirização', 'Custo Mão de Obra', 'Custo Embalagem', 'Frete Entrada', 'Custo Fixo Rateado', 'Depreciação Laser', 'Custo Total', 'Preço Mínimo']
    ];

    savedProducts.filter(p => p.type === 'ring').forEach(product => {
      const calc = product.calculation as any;
      const materialCost = calc.materials?.reduce((sum: number, m: any) => sum + (m.quantity * m.unitCost), 0) || 0;
      const outsourcingCost = calc.outsourcing?.reduce((sum: number, o: any) => sum + o.cost, 0) || 0;
      const laborCost = calc.labor?.reduce((sum: number, l: any) => sum + (l.hours * (l.rate || globalSettings.laborRate)), 0) || 0;

      ringsData.push([
        product.productName,
        product.description,
        materialCost.toFixed(2),
        outsourcingCost.toFixed(2),
        laborCost.toFixed(2),
        (calc.packaging || 0).toFixed(2),
        (calc.inboundFreight || 0).toFixed(2),
        (calc.fixedCostAllocation || 0).toFixed(2),
        (calc.laserDepreciation || 0).toFixed(2),
        calc.totalCost.toFixed(2),
        calc.minimumPrice.toFixed(2)
      ]);
    });

    const ringsSheet = XLSX.utils.aoa_to_sheet(ringsData);
    XLSX.utils.book_append_sheet(workbook, ringsSheet, 'Anilhas_Detalhes');

    // Aba de Brindes Detalhados
    const giftsData = [
      ['Nome', 'Descrição', 'Preço Compra', 'Frete Entrada', 'Custo Mão de Obra', 'Custo Embalagem', 'Custo Fixo Rateado', 'Depreciação Laser', 'Custo Total', 'Preço Mínimo']
    ];

    savedProducts.filter(p => p.type === 'gift').forEach(product => {
      const calc = product.calculation as any;
      const laborCost = calc.labor?.reduce((sum: number, l: any) => sum + (l.hours * (l.rate || globalSettings.laborRate)), 0) || 0;

      giftsData.push([
        product.productName,
        product.description,
        (calc.purchasePrice || 0).toFixed(2),
        (calc.inboundFreight || 0).toFixed(2),
        laborCost.toFixed(2),
        (calc.packaging || 0).toFixed(2),
        (calc.fixedCostAllocation || 0).toFixed(2),
        (calc.laserDepreciation || 0).toFixed(2),
        calc.totalCost.toFixed(2),
        calc.minimumPrice.toFixed(2)
      ]);
    });

    const giftsSheet = XLSX.utils.aoa_to_sheet(giftsData);
    XLSX.utils.book_append_sheet(workbook, giftsSheet, 'Brindes_Detalhes');

    // Salvar arquivo
    const fileName = `Produtos_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Exportação concluída",
      description: `Arquivo ${fileName} baixado com sucesso!`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gerenciamento de Produtos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Filtros e Ações */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1 max-w-md">
              <Label htmlFor="search">Buscar Produtos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={exportToExcel}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{savedProducts.length}</div>
                <p className="text-xs text-muted-foreground">Total de Produtos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{savedProducts.filter(p => p.type === 'ring').length}</div>
                <p className="text-xs text-muted-foreground">Anilhas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{savedProducts.filter(p => p.type === 'gift').length}</div>
                <p className="text-xs text-muted-foreground">Brindes</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Produtos */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum produto encontrado.' : 'Nenhum produto salvo ainda.'}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Custo Total</TableHead>
                    <TableHead>Preço Mínimo</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.type === 'ring' ? 'default' : 'secondary'}>
                          {product.type === 'ring' ? 'Anilha' : 'Brinde'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(product.calculation.totalCost)}</TableCell>
                      <TableCell>{formatCurrency(product.calculation.minimumPrice)}</TableCell>
                      <TableCell>{formatDate(product.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingProduct(product)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Produto: {product.productName}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Nome</Label>
                                    <p className="text-sm">{product.productName}</p>
                                  </div>
                                  <div>
                                    <Label>Tipo</Label>
                                    <p className="text-sm">{product.type === 'ring' ? 'Anilha' : 'Brinde'}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label>Descrição</Label>
                                  <p className="text-sm">{product.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Custo Total</Label>
                                    <p className="text-lg font-semibold">{formatCurrency(product.calculation.totalCost)}</p>
                                  </div>
                                  <div>
                                    <Label>Preço Mínimo</Label>
                                    <p className="text-lg font-semibold">{formatCurrency(product.calculation.minimumPrice)}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Criado em</Label>
                                    <p className="text-sm">{formatDate(product.createdAt)}</p>
                                  </div>
                                  <div>
                                    <Label>Atualizado em</Label>
                                    <p className="text-sm">{formatDate(product.updatedAt)}</p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};