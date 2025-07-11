import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Percent, Calculator, TrendingDown, AlertTriangle } from "lucide-react";
import { GlobalSettings } from "./types";
import { ProductSelector } from "./ProductSelector";

interface DiscountCalculatorProps {
  globalSettings: GlobalSettings;
}

interface DiscountScenario {
  quantity: number;
  discountPercent: number;
  unitPrice: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
}

export const DiscountCalculator = ({ globalSettings }: DiscountCalculatorProps) => {
  const [basePrice, setBasePrice] = useState(0);
  const [baseCost, setBaseCost] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'volume'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [quantities, setQuantities] = useState([1, 10, 50, 100, 500]);
  const [results, setResults] = useState<DiscountScenario[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>();

  const calculateDiscountScenarios = () => {
    const scenarios: DiscountScenario[] = [];
    
    quantities.forEach(quantity => {
      let finalDiscountPercent = 0;
      
      if (discountType === 'percentage') {
        finalDiscountPercent = discountValue;
      } else {
        // Volume discount - scales with quantity
        if (quantity >= 500) finalDiscountPercent = 15;
        else if (quantity >= 100) finalDiscountPercent = 10;
        else if (quantity >= 50) finalDiscountPercent = 7;
        else if (quantity >= 10) finalDiscountPercent = 5;
        else finalDiscountPercent = 0;
      }
      
      const unitPrice = basePrice * (1 - finalDiscountPercent / 100);
      const totalRevenue = unitPrice * quantity;
      const totalCost = baseCost * quantity;
      const totalProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      
      scenarios.push({
        quantity,
        discountPercent: finalDiscountPercent,
        unitPrice,
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin
      });
    });
    
    setResults(scenarios);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getBadgeVariant = (margin: number) => {
    if (margin >= 30) return "default";
    if (margin >= 15) return "secondary";
    if (margin >= 5) return "outline";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Calculadora de Descontos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Seleção de Produto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Produto Base</h3>
            <div className="grid grid-cols-1 gap-4">
              <ProductSelector
                onProductSelect={(product) => {
                  if (product) {
                    setBasePrice(product.calculation.minimumPrice);
                    setBaseCost(product.calculation.totalCost);
                    setSelectedProductId(product.id);
                  } else {
                    setBasePrice(0);
                    setBaseCost(0);
                    setSelectedProductId(undefined);
                  }
                }}
                selectedProductId={selectedProductId}
                placeholder="Selecione um produto para calcular descontos"
              />
            </div>
          </div>

          {/* Parâmetros Base */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Parâmetros Base</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base-price">Preço Base (R$)</Label>
                <Input
                  id="base-price"
                  type="number"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                  placeholder="Preço sem desconto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base-cost">Custo Base (R$)</Label>
                <Input
                  id="base-cost"
                  type="number"
                  step="0.01"
                  value={baseCost}
                  onChange={(e) => setBaseCost(parseFloat(e.target.value) || 0)}
                  placeholder="Custo do produto"
                />
              </div>
            </div>
          </div>

          {/* Configuração de Desconto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuração de Desconto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount-type">Tipo de Desconto</Label>
                <Select value={discountType} onValueChange={(value: 'percentage' | 'volume') => setDiscountType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Desconto Fixo (%)</SelectItem>
                    <SelectItem value="volume">Desconto por Volume</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {discountType === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="discount-value">Desconto (%)</Label>
                  <Input
                    id="discount-value"
                    type="number"
                    step="0.1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder="Percentual de desconto"
                  />
                </div>
              )}
            </div>
            
            {discountType === 'volume' && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Tabela de Desconto por Volume:</h4>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <div>• 10-49 unidades: 5% de desconto</div>
                  <div>• 50-99 unidades: 7% de desconto</div>
                  <div>• 100-499 unidades: 10% de desconto</div>
                  <div>• 500+ unidades: 15% de desconto</div>
                </div>
              </div>
            )}
          </div>

          {/* Quantidades para Simulação */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quantidades para Simulação</h3>
            <div className="flex flex-wrap gap-2">
              {quantities.map((quantity, index) => (
                <Input
                  key={index}
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const newQuantities = [...quantities];
                    newQuantities[index] = parseInt(e.target.value) || 1;
                    setQuantities(newQuantities);
                  }}
                  className="w-20"
                />
              ))}
            </div>
          </div>

          <Button onClick={calculateDiscountScenarios} className="w-full">
            <Calculator className="h-4 w-4 mr-2" />
            Calcular Cenários
          </Button>

          {/* Resultados */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resultados dos Cenários</h3>
              <div className="overflow-x-auto">
                <table className="w-full border rounded-lg">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">Quantidade</th>
                      <th className="p-2 text-left">Desconto</th>
                      <th className="p-2 text-left">Preço Unit.</th>
                      <th className="p-2 text-left">Receita Total</th>
                      <th className="p-2 text-left">Custo Total</th>
                      <th className="p-2 text-left">Lucro Total</th>
                      <th className="p-2 text-left">Margem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((scenario, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 font-medium">{scenario.quantity}</td>
                        <td className="p-2">
                          <Badge variant="outline">
                            {scenario.discountPercent.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-2">{formatCurrency(scenario.unitPrice)}</td>
                        <td className="p-2">{formatCurrency(scenario.totalRevenue)}</td>
                        <td className="p-2">{formatCurrency(scenario.totalCost)}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {formatCurrency(scenario.totalProfit)}
                            {scenario.totalProfit < 0 && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant={getBadgeVariant(scenario.profitMargin)}>
                            {scenario.profitMargin.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Resumo e Recomendações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Melhor Cenário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const bestScenario = results.reduce((best, current) => 
                        current.totalProfit > best.totalProfit ? current : best
                      );
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Quantidade:</span>
                            <span className="font-medium">{bestScenario.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lucro:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(bestScenario.totalProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Margem:</span>
                            <span className="font-medium">
                              {bestScenario.profitMargin.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recomendações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {results.some(r => r.profitMargin < 15) && (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Alguns cenários com margem baixa</span>
                        </div>
                      )}
                      {results.some(r => r.totalProfit < 0) && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Cenários com prejuízo identificados</span>
                        </div>
                      )}
                      <div className="text-muted-foreground">
                        Considere diferentes estratégias de desconto para maximizar lucratividade
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};