import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calculator, Gift } from "lucide-react";
import { GlobalSettings, LaborCost, GiftCalculation } from "./types";
import { toast } from "@/hooks/use-toast";

interface GiftCalculatorProps {
  globalSettings: GlobalSettings;
  onCalculationSave: (calculation: GiftCalculation) => void;
}

export const GiftCalculator = ({ globalSettings, onCalculationSave }: GiftCalculatorProps) => {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [freight, setFreight] = useState(0);
  const [labor, setLabor] = useState<LaborCost[]>([
    { description: "Gravação a laser", minutes: 0 }
  ]);
  const [packaging, setPackaging] = useState(0);
  const [marketPrice, setMarketPrice] = useState(0);

  const addLabor = () => {
    setLabor([...labor, { description: "", minutes: 0 }]);
  };

  const removeLabor = (index: number) => {
    setLabor(labor.filter((_, i) => i !== index));
  };

  const updateLabor = (index: number, field: keyof LaborCost, value: any) => {
    const updated = [...labor];
    updated[index] = { ...updated[index], [field]: value };
    setLabor(updated);
  };

  const calculateCosts = (): GiftCalculation => {
    // Custos diretos
    const totalLaborMinutes = labor.reduce((sum, l) => sum + l.minutes, 0);
    const totalLaborHours = totalLaborMinutes / 60;
    const laborCosts = totalLaborHours * globalSettings.laborRate;
    const laserDepreciation = totalLaborHours * globalSettings.laserDepreciationRate;
    
    const totalDirectCost = purchasePrice + freight + laborCosts + packaging;
    
    // Custos indiretos
    const fixedCostAllocation = globalSettings.monthlyFixedCosts / globalSettings.monthlyProduction;
    
    const totalCost = totalDirectCost + fixedCostAllocation + laserDepreciation;
    
    // Cálculo do preço mínimo (incluindo impostos e comissões)
    const taxRate = globalSettings.taxRegime === 'simples' ? 6.0 : 
                   (globalSettings.icmsRate + globalSettings.pisRate + globalSettings.cofinsRate);
    
    const totalTaxAndCommission = taxRate + globalSettings.commissionRate + globalSettings.freightRate;
    const minimumPrice = totalCost / (1 - totalTaxAndCommission / 100);
    
    // Margens sugeridas
    const suggestedMargins = [20, 30, 40, 50, 60].map(margin => 
      totalCost * (1 + margin / 100) / (1 - totalTaxAndCommission / 100)
    );

    // Análise competitiva
    let competitiveAnalysis;
    if (marketPrice > 0) {
      const ourMargin = ((marketPrice - totalCost) / marketPrice) * 100;
      let recommendation = "";
      
      if (ourMargin > 40) {
        recommendation = "Excelente margem! Produto altamente rentável.";
      } else if (ourMargin > 20) {
        recommendation = "Margem adequada. Produto viável.";
      } else if (ourMargin > 0) {
        recommendation = "Margem baixa. Considere reduzir custos ou reposicionar o produto.";
      } else {
        recommendation = "ATENÇÃO: Produto com prejuízo! Revisar estratégia.";
      }
      
      competitiveAnalysis = {
        marketPrice,
        ourMargin,
        recommendation
      };
    }

    return {
      id: Date.now().toString(),
      productName,
      description,
      purchasePrice,
      inboundFreight: freight,
      labor,
      packaging,
      fixedCostAllocation,
      laserDepreciation,
      totalCost,
      suggestedMargins,
      minimumPrice,
      competitiveAnalysis,
      profitMargins: suggestedMargins.map((price, index) => ({
        marginPercent: [20, 30, 40, 50, 60][index],
        sellingPrice: price,
        totalTaxes: price * (taxRate / 100),
        totalDifal: 0, // DIFAL será calculado na PricingTable com estado do cliente
        totalCommission: price * (globalSettings.commissionRate / 100),
        totalOutboundFreight: price * (globalSettings.freightRate / 100),
        netProfit: price - totalCost - (price * (taxRate + globalSettings.commissionRate + globalSettings.freightRate) / 100),
        netMarginPercent: ((price - totalCost - (price * (taxRate + globalSettings.commissionRate + globalSettings.freightRate) / 100)) / price) * 100
      }))
    };
  };

  const handleCalculate = () => {
    if (!productName.trim()) {
      toast({
        title: "Erro",
        description: "Informe o nome do produto",
        variant: "destructive"
      });
      return;
    }

    const calculation = calculateCosts();
    onCalculationSave(calculation);

    // Salvar no localStorage
    const savedProduct = {
      id: calculation.id,
      type: 'gift' as const,
      productName,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      calculation
    };

    const existingProducts = JSON.parse(localStorage.getItem('savedProducts') || '[]');
    const updatedProducts = [...existingProducts, savedProduct];
    localStorage.setItem('savedProducts', JSON.stringify(updatedProducts));
    
    toast({
      title: "Produto salvo",
      description: "Brinde calculado e salvo com sucesso!",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Calculadora de Custos - Brindes Personalizados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Informações do Produto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Informações do Produto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Nome do Produto</Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="ex: Caneta Metal Personalizada"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes do produto, cor, material, etc."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Custos de Aquisição */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Custos de Aquisição</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Preço de Compra (R$)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                  placeholder="Preço unitário de compra"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freight">Frete de Entrada - Logística (R$)</Label>
                <Input
                  id="freight"
                  type="number"
                  step="0.01"
                  value={freight}
                  onChange={(e) => setFreight(parseFloat(e.target.value) || 0)}
                  placeholder="Custo de frete por unidade"
                />
              </div>
            </div>
          </div>

          {/* Mão de obra */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Mão de Obra (Personalização)</h3>
              <Button onClick={addLabor} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Atividade
              </Button>
            </div>
            
            {labor.map((laborItem, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Descrição da Atividade</Label>
                  <Input
                    value={laborItem.description}
                    onChange={(e) => updateLabor(index, 'description', e.target.value)}
                    placeholder="ex: Gravação a laser"
                  />
                </div>
                <div className="space-y-2">
                   <Label>Minutos</Label>
                   <Input
                     type="number"
                     step="1"
                     value={laborItem.minutes}
                     onChange={(e) => updateLabor(index, 'minutes', parseFloat(e.target.value) || 0)}
                   />
                 </div>
                <div className="space-y-2">
                  <Label>Taxa (R$/h)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={laborItem.rate || globalSettings.laborRate}
                    onChange={(e) => updateLabor(index, 'rate', parseFloat(e.target.value) || globalSettings.laborRate)}
                    placeholder={`Padrão: ${formatCurrency(globalSettings.laborRate)}`}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => removeLabor(index)}
                    variant="ghost"
                    size="sm"
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Outros Custos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Outros Custos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packaging">Embalagem (R$)</Label>
                <Input
                  id="packaging"
                  type="number"
                  step="0.01"
                  value={packaging}
                  onChange={(e) => setPackaging(parseFloat(e.target.value) || 0)}
                  placeholder="ex: 2.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marketPrice">Preço de Mercado (R$) - Opcional</Label>
                <Input
                  id="marketPrice"
                  type="number"
                  step="0.01"
                  value={marketPrice}
                  onChange={(e) => setMarketPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Para análise competitiva"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleCalculate} className="bg-gradient-primary hover:opacity-90">
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Custos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};