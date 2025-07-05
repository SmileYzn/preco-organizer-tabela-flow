import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calculator, CircleDot } from "lucide-react";
import { GlobalSettings, MaterialCost, OutsourcingCost, LaborCost, RingCalculation, TubeCalculation } from "./types";
import { TubeCalculator } from "./TubeCalculator";
import { toast } from "@/hooks/use-toast";

interface RingCalculatorProps {
  globalSettings: GlobalSettings;
  onCalculationSave: (calculation: RingCalculation) => void;
}

export const RingCalculator = ({ globalSettings, onCalculationSave }: RingCalculatorProps) => {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState<MaterialCost[]>([
    { description: "Tubo de alumínio", quantity: 1, unitCost: 0, unit: "metro" }
  ]);
  const [outsourcing, setOutsourcing] = useState<OutsourcingCost[]>([
    { description: "Corte do tubo", cost: 0, supplier: "" },
    { description: "Anodização", cost: 0, supplier: "" }
  ]);
  const [labor, setLabor] = useState<LaborCost[]>([
    { description: "Marcação a laser", hours: 0 }
  ]);
  const [packaging, setPackaging] = useState(0);
  const [inboundFreight, setInboundFreight] = useState(0);
  const [tubeCalculation, setTubeCalculation] = useState<TubeCalculation | null>(null);

  const addMaterial = () => {
    setMaterials([...materials, { description: "", quantity: 1, unitCost: 0, unit: "unidade" }]);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: keyof MaterialCost, value: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    
    // Se for tubo de alumínio e houver cálculo de tubo, atualizar com os valores calculados
    if (updated[index].isAluminumTube && tubeCalculation) {
      updated[index].unitCost = tubeCalculation.costPerUnit;
      updated[index].quantity = 1; // Uma anilha por cálculo
    }
    
    setMaterials(updated);
  };

  const addOutsourcing = () => {
    setOutsourcing([...outsourcing, { description: "", cost: 0, supplier: "" }]);
  };

  const removeOutsourcing = (index: number) => {
    setOutsourcing(outsourcing.filter((_, i) => i !== index));
  };

  const updateOutsourcing = (index: number, field: keyof OutsourcingCost, value: any) => {
    const updated = [...outsourcing];
    updated[index] = { ...updated[index], [field]: value };
    setOutsourcing(updated);
  };

  const addLabor = () => {
    setLabor([...labor, { description: "", hours: 0 }]);
  };

  const removeLabor = (index: number) => {
    setLabor(labor.filter((_, i) => i !== index));
  };

  const updateLabor = (index: number, field: keyof LaborCost, value: any) => {
    const updated = [...labor];
    updated[index] = { ...updated[index], [field]: value };
    setLabor(updated);
  };

  const handleTubeCalculation = (calculation: TubeCalculation) => {
    setTubeCalculation(calculation);
    
    // Atualizar materiais que são tubos de alumínio
    const updatedMaterials = materials.map(material => {
      if (material.isAluminumTube) {
        return {
          ...material,
          unitCost: calculation.costPerUnit,
          quantity: 1,
          calculatedUnitsPerMeter: calculation.unitsPerMeter
        };
      }
      return material;
    });
    setMaterials(updatedMaterials);
  };

  const calculateCosts = (): RingCalculation => {
    // Custos diretos
    const materialCosts = materials.reduce((sum, m) => sum + (m.quantity * m.unitCost), 0);
    const outsourcingCosts = outsourcing.reduce((sum, o) => sum + o.cost, 0);
    const totalLaborHours = labor.reduce((sum, l) => sum + l.hours, 0);
    const laborCosts = totalLaborHours * globalSettings.laborRate;
    const laserDepreciation = totalLaborHours * globalSettings.laserDepreciationRate;
    
    const totalDirectCost = materialCosts + outsourcingCosts + laborCosts + packaging + inboundFreight;
    
    // Custos indiretos
    const fixedCostAllocation = globalSettings.monthlyFixedCosts / globalSettings.monthlyProduction;
    const totalIndirectCost = fixedCostAllocation + laserDepreciation;
    
    const totalCost = totalDirectCost + totalIndirectCost;
    
    // Cálculo do preço mínimo (incluindo impostos e comissões)
    const taxRate = globalSettings.taxRegime === 'simples' ? 6.0 : 
                   (globalSettings.icmsRate + globalSettings.pisRate + globalSettings.cofinsRate);
    
    const totalTaxAndCommission = taxRate + globalSettings.commissionRate + globalSettings.freightRate;
    const minimumPrice = totalCost / (1 - totalTaxAndCommission / 100);
    
    // Margens sugeridas
    const suggestedMargins = [20, 30, 40, 50, 60].map(margin => 
      totalCost * (1 + margin / 100) / (1 - totalTaxAndCommission / 100)
    );

    return {
      id: Date.now().toString(),
      productName,
      description,
      materials,
      outsourcing,
      labor,
      packaging,
      inboundFreight,
      fixedCostAllocation,
      laserDepreciation,
      totalDirectCost,
      totalIndirectCost,
      totalCost,
      suggestedMargins,
      minimumPrice,
      breakEvenQuantity: Math.ceil(globalSettings.monthlyFixedCosts / (minimumPrice - totalDirectCost)),
      profitMargins: suggestedMargins.map((price, index) => ({
        marginPercent: [20, 30, 40, 50, 60][index],
        sellingPrice: price,
        totalTaxes: price * (taxRate / 100),
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
    
    toast({
      title: "Cálculo realizado",
      description: "Custos calculados com sucesso!",
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
            <CircleDot className="h-5 w-5" />
            Calculadora de Custos - Anilhas de Pássaros
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
                  placeholder="ex: Anilha Canário 2.5mm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes do produto, medidas, cor, etc."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Calculadora de Tubo (se aplicável) */}
          {materials.some(m => m.isAluminumTube) && (
            <TubeCalculator 
              onCalculationChange={handleTubeCalculation}
              initialValues={tubeCalculation ? {
                tubePrice: tubeCalculation.tubePrice,
                ringHeight: tubeCalculation.ringHeight,
                cuttingLoss: tubeCalculation.cuttingLoss
              } : undefined}
            />
          )}

          {/* Matérias-primas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Matérias-primas</h3>
              <Button onClick={addMaterial} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Material
              </Button>
            </div>
            
            {materials.map((material, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={material.description}
                    onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                    placeholder="ex: Tubo de alumínio"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={material.isAluminumTube ? 'tube' : 'other'}
                    onChange={(e) => updateMaterial(index, 'isAluminumTube', e.target.value === 'tube')}
                  >
                    <option value="other">Material comum</option>
                    <option value="tube">Tubo de alumínio</option>
                  </select>
                </div>
                {!material.isAluminumTube && (
                  <>
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={material.quantity}
                        onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Custo Unitário (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={material.unitCost}
                        onChange={(e) => updateMaterial(index, 'unitCost', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unidade</Label>
                      <Input
                        value={material.unit}
                        onChange={(e) => updateMaterial(index, 'unit', e.target.value)}
                        placeholder="ex: metro, kg, unidade"
                      />
                    </div>
                  </>
                )}
                {material.isAluminumTube && (
                  <>
                    <div className="space-y-2">
                      <Label>Qtd. (calculada)</Label>
                      <Input
                        type="number"
                        value={1}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Custo (calculado)</Label>
                      <Input
                        type="number"
                        value={material.unitCost}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rendimento (un/m)</Label>
                      <Input
                        type="number"
                        value={material.calculatedUnitsPerMeter || 0}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </>
                )}
                <div className="flex items-end">
                  <Button
                    onClick={() => removeMaterial(index)}
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

          {/* Terceirização */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Serviços Terceirizados</h3>
              <Button onClick={addOutsourcing} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Serviço
              </Button>
            </div>
            
            {outsourcing.map((service, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Descrição do Serviço</Label>
                  <Input
                    value={service.description}
                    onChange={(e) => updateOutsourcing(index, 'description', e.target.value)}
                    placeholder="ex: Corte do tubo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={service.cost}
                    onChange={(e) => updateOutsourcing(index, 'cost', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Input
                    value={service.supplier || ""}
                    onChange={(e) => updateOutsourcing(index, 'supplier', e.target.value)}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => removeOutsourcing(index)}
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

          {/* Mão de obra */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Mão de Obra</h3>
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
                    placeholder="ex: Marcação a laser"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horas</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={laborItem.hours}
                    onChange={(e) => updateLabor(index, 'hours', parseFloat(e.target.value) || 0)}
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

          {/* Embalagem e Frete */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Embalagem e Logística</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packaging">Custo de Embalagem (R$)</Label>
                <Input
                  id="packaging"
                  type="number"
                  step="0.01"
                  value={packaging}
                  onChange={(e) => setPackaging(parseFloat(e.target.value) || 0)}
                  placeholder="ex: 1.50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inboundFreight">Frete de Entrada - Matéria Prima (R$)</Label>
                <Input
                  id="inboundFreight"
                  type="number"
                  step="0.01"
                  value={inboundFreight}
                  onChange={(e) => setInboundFreight(parseFloat(e.target.value) || 0)}
                  placeholder="ex: 2.00"
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