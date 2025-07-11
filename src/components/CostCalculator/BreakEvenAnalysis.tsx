import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Target, Calculator, TrendingUp, AlertCircle } from "lucide-react";
import { GlobalSettings, RingCalculation, GiftCalculation } from "./types";

interface BreakEvenAnalysisProps {
  globalSettings: GlobalSettings;
  calculations: (RingCalculation | GiftCalculation)[];
}

interface BreakEvenScenario {
  quantity: number;
  revenue: number;
  variableCosts: number;
  fixedCosts: number;
  totalCosts: number;
  profit: number;
  isBreakEven: boolean;
}

interface BreakEvenResults {
  breakEvenPoint: number;
  breakEvenRevenue: number;
  contributionMargin: number;
  contributionMarginPercent: number;
  scenarios: BreakEvenScenario[];
}

export const BreakEvenAnalysis = ({ globalSettings, calculations }: BreakEvenAnalysisProps) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [targetQuantity, setTargetQuantity] = useState(100);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [results, setResults] = useState<BreakEvenResults | null>(null);

  const getProductOptions = () => {
    // Buscar produtos salvos também
    const savedProducts = JSON.parse(localStorage.getItem('savedProducts') || '[]');
    const allProducts = [
      ...calculations.map(calc => ({
        id: calc.id,
        name: calc.productName,
        calculation: calc
      })),
      ...savedProducts.map((product: any) => ({
        id: product.id,
        name: product.productName,
        calculation: product.calculation
      }))
    ];
    
    // Remover duplicatas
    const uniqueProducts = allProducts.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    );
    
    return uniqueProducts;
  };

  const calculateBreakEven = () => {
    if (!selectedProduct) return;
    
    const productOptions = getProductOptions();
    const selectedProductData = productOptions.find(p => p.id === selectedProduct);
    if (!selectedProductData) return;
    
    const product = selectedProductData.calculation;

    // Custos variáveis por unidade
    let variableCostPerUnit = 0;
    
    if ('materials' in product) {
      // Anilhas
      variableCostPerUnit += product.materials.reduce((sum, m) => sum + (m.quantity * m.unitCost), 0);
      variableCostPerUnit += product.outsourcing.reduce((sum, o) => sum + o.cost, 0);
      variableCostPerUnit += (product.labor.reduce((sum, l) => sum + l.minutes, 0) / 60) * globalSettings.laborRate;
      variableCostPerUnit += product.packaging;
      variableCostPerUnit += product.inboundFreight;
    } else {
      // Brindes
      variableCostPerUnit += product.purchasePrice;
      variableCostPerUnit += product.inboundFreight;
      variableCostPerUnit += (product.labor.reduce((sum, l) => sum + l.minutes, 0) / 60) * globalSettings.laborRate;
      variableCostPerUnit += product.packaging;
    }

    // Custos fixos
    const fixedCosts = product.fixedCostAllocation * globalSettings.monthlyProduction;
    
    // Margem de contribuição
    const contributionMargin = sellingPrice - variableCostPerUnit;
    const contributionMarginPercent = contributionMargin > 0 ? (contributionMargin / sellingPrice) * 100 : 0;
    
    // Ponto de equilíbrio
    const breakEvenPoint = contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : 0;
    const breakEvenRevenue = breakEvenPoint * sellingPrice;
    
    // Cenários
    const scenarios: BreakEvenScenario[] = [];
    const quantities = [
      Math.floor(breakEvenPoint * 0.5),
      Math.floor(breakEvenPoint * 0.8),
      breakEvenPoint,
      Math.floor(breakEvenPoint * 1.2),
      Math.floor(breakEvenPoint * 1.5),
      targetQuantity
    ].filter((q, i, arr) => arr.indexOf(q) === i && q > 0).sort((a, b) => a - b);

    quantities.forEach(quantity => {
      const revenue = quantity * sellingPrice;
      const variableCosts = quantity * variableCostPerUnit;
      const totalCosts = variableCosts + fixedCosts;
      const profit = revenue - totalCosts;
      
      scenarios.push({
        quantity,
        revenue,
        variableCosts,
        fixedCosts,
        totalCosts,
        profit,
        isBreakEven: Math.abs(profit) < 1
      });
    });

    setResults({
      breakEvenPoint,
      breakEvenRevenue,
      contributionMargin,
      contributionMarginPercent,
      scenarios
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getChartData = () => {
    if (!results) return [];
    
    return results.scenarios.map(scenario => ({
      quantity: scenario.quantity,
      receita: scenario.revenue,
      custos: scenario.totalCosts,
      lucro: scenario.profit
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análise de Ponto de Equilíbrio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Parâmetros da Análise */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Parâmetros da Análise</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-select">Produto</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {getProductOptions().map(option => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="selling-price">Preço de Venda (R$)</Label>
                <Input
                  id="selling-price"
                  type="number"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Preço unitário"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target-quantity">Quantidade Alvo</Label>
                <Input
                  id="target-quantity"
                  type="number"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Quantidade desejada"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={calculateBreakEven} 
            className="w-full"
            disabled={!selectedProduct || sellingPrice <= 0}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calcular Ponto de Equilíbrio
          </Button>

          {/* Resultados */}
          {results && (
            <div className="space-y-6">
              <Separator />
              
              {/* Resumo do Ponto de Equilíbrio */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Ponto de Equilíbrio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {results.breakEvenPoint.toLocaleString()} un
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Unidades necessárias
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Receita de Equilíbrio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(results.breakEvenRevenue)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Receita necessária
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Margem de Contribuição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(results.contributionMargin)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {results.contributionMarginPercent.toFixed(1)}% do preço
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Status da Quantidade Alvo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant={targetQuantity >= results.breakEvenPoint ? "default" : "destructive"}>
                        {targetQuantity >= results.breakEvenPoint ? 'Lucrativo' : 'Prejuízo'}
                      </Badge>
                      {targetQuantity < results.breakEvenPoint && (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {targetQuantity >= results.breakEvenPoint 
                        ? `+${(targetQuantity - results.breakEvenPoint).toLocaleString()} unidades acima`
                        : `${(results.breakEvenPoint - targetQuantity).toLocaleString()} unidades abaixo`
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Análise */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Análise de Receita vs Custos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="quantity" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => `${label} unidades`}
                        />
                        <ReferenceLine y={0} stroke="#000" strokeDasharray="2 2" />
                        <Bar dataKey="receita" fill="#3b82f6" name="Receita" />
                        <Bar dataKey="custos" fill="#ef4444" name="Custos" />
                        <Bar dataKey="lucro" fill="#10b981" name="Lucro" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela de Cenários */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cenários de Quantidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border rounded-lg">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left">Quantidade</th>
                          <th className="p-2 text-left">Receita</th>
                          <th className="p-2 text-left">Custos Variáveis</th>
                          <th className="p-2 text-left">Custos Fixos</th>
                          <th className="p-2 text-left">Custos Totais</th>
                          <th className="p-2 text-left">Lucro</th>
                          <th className="p-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.scenarios.map((scenario, index) => (
                          <tr key={index} className={`border-t ${scenario.isBreakEven ? 'bg-yellow-50' : ''}`}>
                            <td className="p-2 font-medium">
                              {scenario.quantity.toLocaleString()}
                              {scenario.isBreakEven && (
                                <Badge variant="outline" className="ml-2">Break-even</Badge>
                              )}
                            </td>
                            <td className="p-2">{formatCurrency(scenario.revenue)}</td>
                            <td className="p-2">{formatCurrency(scenario.variableCosts)}</td>
                            <td className="p-2">{formatCurrency(scenario.fixedCosts)}</td>
                            <td className="p-2">{formatCurrency(scenario.totalCosts)}</td>
                            <td className="p-2">
                              <span className={scenario.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(scenario.profit)}
                              </span>
                            </td>
                            <td className="p-2">
                              <Badge variant={scenario.profit >= 0 ? "default" : "destructive"}>
                                {scenario.profit >= 0 ? 'Lucro' : 'Prejuízo'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Insights e Recomendações */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Insights e Recomendações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.contributionMarginPercent < 30 && (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Margem de contribuição baixa ({results.contributionMarginPercent.toFixed(1)}%). Considere aumentar preço ou reduzir custos variáveis.</span>
                      </div>
                    )}
                    
                    {results.breakEvenPoint > 1000 && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Ponto de equilíbrio alto ({results.breakEvenPoint.toLocaleString()} unidades). Avalie reduzir custos fixos.</span>
                      </div>
                    )}
                    
                    {targetQuantity >= results.breakEvenPoint && (
                      <div className="flex items-center gap-2 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        <span>Sua quantidade alvo é lucrativa! Lucro esperado: {formatCurrency(results.scenarios.find(s => s.quantity === targetQuantity)?.profit || 0)}</span>
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground">
                      <strong>Dica:</strong> Para melhorar a lucratividade, foque em aumentar a margem de contribuição através do aumento de preços ou redução de custos variáveis.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};