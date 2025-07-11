import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Package, Search, FileSpreadsheet, Copy, CheckSquare } from "lucide-react";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

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
    window.dispatchEvent(new Event('productsUpdated'));
    
    toast({
      title: "Produto excluído",
      description: "Produto removido com sucesso!",
    });
  };

  const saveEditedProduct = () => {
    if (!editingProduct) return;
    
    const updated = savedProducts.map(p => 
      p.id === editingProduct.id 
        ? { ...editingProduct, updatedAt: new Date().toISOString() }
        : p
    );
    
    setSavedProducts(updated);
    localStorage.setItem('savedProducts', JSON.stringify(updated));
    window.dispatchEvent(new Event('productsUpdated'));
    setIsEditDialogOpen(false);
    setEditingProduct(null);
    
    toast({
      title: "Produto atualizado",
      description: "Produto editado com sucesso!",
    });
  };

  const handleEditField = (field: string, value: any) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      [field]: value
    });
  };

  const handleEditCalculationField = (arrayName: string, index: number, field: string, value: any) => {
    if (!editingProduct) return;
    
    const calculation = editingProduct.calculation as any;
    const updatedArray = [...(calculation[arrayName] || [])];
    updatedArray[index] = {
      ...updatedArray[index],
      [field]: value
    };
    
    setEditingProduct({
      ...editingProduct,
      calculation: {
        ...calculation,
        [arrayName]: updatedArray
      }
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

  const replicateProduct = (product: SavedProduct) => {
    const replicated = {
      ...product,
      id: Date.now().toString(),
      productName: `${product.productName} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updated = [...savedProducts, replicated];
    setSavedProducts(updated);
    localStorage.setItem('savedProducts', JSON.stringify(updated));
    window.dispatchEvent(new Event('productsUpdated'));
    
    toast({
      title: "Produto replicado",
      description: "Produto copiado com sucesso! Edite as informações conforme necessário.",
    });
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedProducts(prev => 
      prev.length === filteredProducts.length 
        ? [] 
        : filteredProducts.map(p => p.id)
    );
  };

  const exportToExcel = () => {
    const productsToExport = selectedProducts.length > 0 
      ? savedProducts.filter(p => selectedProducts.includes(p.id))
      : savedProducts;
      
    if (productsToExport.length === 0) {
      toast({
        title: "Nenhum produto para exportar",
        description: selectedProducts.length > 0 ? "Selecione produtos para exportar." : "Adicione produtos antes de exportar.",
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

    productsToExport.forEach(product => {
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

    productsToExport.filter(p => p.type === 'ring').forEach(product => {
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

    productsToExport.filter(p => p.type === 'gift').forEach(product => {
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
                onClick={toggleSelectAll}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                {selectedProducts.length === filteredProducts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
              <Button 
                onClick={exportToExcel}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel {selectedProducts.length > 0 && `(${selectedProducts.length})`}
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
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
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
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="rounded"
                        />
                      </TableCell>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => replicateProduct(product)}
                            title="Replicar produto"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingProduct(product);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Editar Produto: {editingProduct?.productName}</DialogTitle>
                              </DialogHeader>
                              {editingProduct && (
                                <div className="space-y-6">
                                  {/* Informações Básicas */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-name">Nome do Produto</Label>
                                      <Input
                                        id="edit-name"
                                        value={editingProduct.productName}
                                        onChange={(e) => handleEditField('productName', e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Tipo</Label>
                                      <p className="text-sm bg-muted p-2 rounded">
                                        {editingProduct.type === 'ring' ? 'Anilha' : 'Brinde'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-description">Descrição</Label>
                                    <Input
                                      id="edit-description"
                                      value={editingProduct.description}
                                      onChange={(e) => handleEditField('description', e.target.value)}
                                    />
                                  </div>

                                  {/* Dados de Cálculo Editáveis */}
                                  {editingProduct.type === 'ring' && (
                                    <div className="space-y-4">
                                      <h3 className="text-lg font-semibold">Dados de Cálculo - Anilha</h3>
                                      
                                      {/* Materiais */}
                                      <div className="space-y-2">
                                        <Label>Materiais</Label>
                                        {(editingProduct.calculation as any).materials?.map((material: any, index: number) => (
                                          <div key={index} className="grid grid-cols-4 gap-2 p-2 border rounded">
                                            <Input
                                              placeholder="Descrição"
                                              value={material.description}
                                              onChange={(e) => handleEditCalculationField('materials', index, 'description', e.target.value)}
                                            />
                                            <Input
                                              type="number"
                                              placeholder="Quantidade"
                                              value={material.quantity}
                                              onChange={(e) => handleEditCalculationField('materials', index, 'quantity', parseFloat(e.target.value) || 0)}
                                            />
                                            <Input
                                              type="number"
                                              placeholder="Custo unitário"
                                              value={material.unitCost}
                                              onChange={(e) => handleEditCalculationField('materials', index, 'unitCost', parseFloat(e.target.value) || 0)}
                                            />
                                            <Input
                                              placeholder="Unidade"
                                              value={material.unit}
                                              onChange={(e) => handleEditCalculationField('materials', index, 'unit', e.target.value)}
                                            />
                                          </div>
                                        ))}
                                      </div>

                                      {/* Terceirização */}
                                      <div className="space-y-2">
                                        <Label>Terceirização</Label>
                                        {(editingProduct.calculation as any).outsourcing?.map((outsource: any, index: number) => (
                                          <div key={index} className="grid grid-cols-2 gap-2 p-2 border rounded">
                                            <Input
                                              placeholder="Descrição"
                                              value={outsource.description}
                                              onChange={(e) => handleEditCalculationField('outsourcing', index, 'description', e.target.value)}
                                            />
                                            <Input
                                              type="number"
                                              placeholder="Custo"
                                              value={outsource.cost}
                                              onChange={(e) => handleEditCalculationField('outsourcing', index, 'cost', parseFloat(e.target.value) || 0)}
                                            />
                                          </div>
                                        ))}
                                      </div>

                                      {/* Mão de Obra */}
                                      <div className="space-y-2">
                                        <Label>Mão de Obra</Label>
                                        {(editingProduct.calculation as any).labor?.map((labor: any, index: number) => (
                                          <div key={index} className="grid grid-cols-2 gap-2 p-2 border rounded">
                                            <Input
                                              placeholder="Descrição"
                                              value={labor.description}
                                              onChange={(e) => handleEditCalculationField('labor', index, 'description', e.target.value)}
                                            />
                                            <Input
                                              type="number"
                                              placeholder="Minutos"
                                              value={labor.minutes}
                                              onChange={(e) => handleEditCalculationField('labor', index, 'minutes', parseFloat(e.target.value) || 0)}
                                            />
                                          </div>
                                        ))}
                                      </div>

                                      {/* Outros custos */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label>Embalagem (R$)</Label>
                                          <Input
                                            type="number"
                                            value={(editingProduct.calculation as any).packaging || 0}
                                            onChange={(e) => handleEditField('calculation', {
                                              ...editingProduct.calculation,
                                              packaging: parseFloat(e.target.value) || 0
                                            })}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Frete de Entrada (R$)</Label>
                                          <Input
                                            type="number"
                                            value={(editingProduct.calculation as any).inboundFreight || 0}
                                            onChange={(e) => handleEditField('calculation', {
                                              ...editingProduct.calculation,
                                              inboundFreight: parseFloat(e.target.value) || 0
                                            })}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {editingProduct.type === 'gift' && (
                                    <div className="space-y-4">
                                      <h3 className="text-lg font-semibold">Dados de Cálculo - Brinde</h3>
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label>Preço de Compra (R$)</Label>
                                          <Input
                                            type="number"
                                            value={(editingProduct.calculation as any).purchasePrice || 0}
                                            onChange={(e) => handleEditField('calculation', {
                                              ...editingProduct.calculation,
                                              purchasePrice: parseFloat(e.target.value) || 0
                                            })}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Frete de Entrada (R$)</Label>
                                          <Input
                                            type="number"
                                            value={(editingProduct.calculation as any).inboundFreight || 0}
                                            onChange={(e) => handleEditField('calculation', {
                                              ...editingProduct.calculation,
                                              inboundFreight: parseFloat(e.target.value) || 0
                                            })}
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label>Embalagem (R$)</Label>
                                          <Input
                                            type="number"
                                            value={(editingProduct.calculation as any).packaging || 0}
                                            onChange={(e) => handleEditField('calculation', {
                                              ...editingProduct.calculation,
                                              packaging: parseFloat(e.target.value) || 0
                                            })}
                                          />
                                        </div>
                                      </div>

                                      {/* Mão de Obra para Brindes */}
                                      <div className="space-y-2">
                                        <Label>Mão de Obra</Label>
                                        {(editingProduct.calculation as any).labor?.map((labor: any, index: number) => (
                                          <div key={index} className="grid grid-cols-2 gap-2 p-2 border rounded">
                                            <Input
                                              placeholder="Descrição"
                                              value={labor.description}
                                              onChange={(e) => handleEditCalculationField('labor', index, 'description', e.target.value)}
                                            />
                                            <Input
                                              type="number"
                                              placeholder="Minutos"
                                              value={labor.minutes}
                                              onChange={(e) => handleEditCalculationField('labor', index, 'minutes', parseFloat(e.target.value) || 0)}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Custos Calculados (apenas visualização) */}
                                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    <div>
                                      <Label>Custo Total (Calculado)</Label>
                                      <p className="text-lg font-semibold bg-muted p-2 rounded">
                                        {formatCurrency(editingProduct.calculation.totalCost)}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Preço Mínimo (Calculado)</Label>
                                      <p className="text-lg font-semibold bg-muted p-2 rounded">
                                        {formatCurrency(editingProduct.calculation.minimumPrice)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Criado em</Label>
                                      <p className="text-sm text-muted-foreground">{formatDate(editingProduct.createdAt)}</p>
                                    </div>
                                    <div>
                                      <Label>Última atualização</Label>
                                      <p className="text-sm text-muted-foreground">{formatDate(editingProduct.updatedAt)}</p>
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2 pt-4">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => {
                                        setIsEditDialogOpen(false);
                                        setEditingProduct(null);
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button onClick={saveEditedProduct}>
                                      Salvar Alterações
                                    </Button>
                                  </div>
                                </div>
                              )}
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