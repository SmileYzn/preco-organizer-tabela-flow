import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, DollarSign, AlertTriangle, Target } from "lucide-react";
import { RingCalculation, GiftCalculation, GlobalSettings } from "./types";
import { PricingTable } from "./PricingTable";

interface CalculationResultsProps {
  calculations: (RingCalculation | GiftCalculation)[];
  globalSettings: GlobalSettings;
}

export const CalculationResults = ({ calculations, globalSettings }: CalculationResultsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (calculations.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <p className="mb-4">Nenhum cálculo realizado ainda.</p>
            <p className="text-sm">Esta aba mostra os resultados detalhados dos cálculos realizados nas abas "Anilhas" e "Brindes".</p>
            <p className="text-sm mt-2">Para ver os resultados aqui:</p>
            <ol className="text-sm mt-2 space-y-1 text-left max-w-md mx-auto">
              <li>1. Vá para a aba "Anilhas" ou "Brindes"</li>
              <li>2. Preencha os dados do produto</li>
              <li>3. Clique em "Calcular Custos"</li>
              <li>4. Os resultados aparecerão automaticamente aqui</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {calculations.map((calc) => (
        <Card key={calc.id} className="shadow-card">
          <CardHeader className="bg-gradient-subtle">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {'materials' in calc ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <DollarSign className="h-5 w-5 text-primary" />
                )}
                <span>{calc.productName}</span>
                <Badge variant="outline">
                  {'materials' in calc ? 'Anilha' : 'Brinde'}
                </Badge>
              </div>
            </CardTitle>
            {calc.description && (
              <p className="text-sm text-muted-foreground">{calc.description}</p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {/* Breakdown de Custos */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Breakdown de Custos</h4>
              
              {'materials' in calc ? (
                // Anilhas
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Matérias-primas:</span>
                      <span className="float-right font-medium">
                        {formatCurrency(calc.materials.reduce((sum, m) => sum + (m.quantity * m.unitCost), 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Terceirização:</span>
                      <span className="float-right font-medium">
                        {formatCurrency(calc.outsourcing.reduce((sum, o) => sum + o.cost, 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mão de obra:</span>
                      <span className="float-right font-medium">
                        {formatCurrency(calc.labor.reduce((sum, l) => sum + (l.minutes / 60), 0) * 25)} {/* convertendo minutos para horas */}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Embalagem:</span>
                      <span className="float-right font-medium">
                        {formatCurrency(calc.packaging)}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Depreciação laser:</span>
                      <span className="float-right font-medium">
                        {formatCurrency(calc.laserDepreciation)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Custos fixos (rateio):</span>
                      <span className="float-right font-medium">
                        {formatCurrency(calc.fixedCostAllocation)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Brindes
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Preço de compra:</span>
                      <span className="float-right font-medium">
                        {formatCurrency(calc.purchasePrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Frete de Entrada:</span>
                      <span className="float-right font-medium">
                        {formatCurrency(calc.inboundFreight)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Personalização:</span>
                      <span className="float-right font-medium">
                        {formatCurrency(calc.labor.reduce((sum, l) => sum + (l.minutes / 60), 0) * 25)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Embalagem:</span>
                      <span className="float-right font-medium">
                        {formatCurrency(calc.packaging)}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Depreciação laser:</span>
                      <span className="float-right font-medium">
                        {formatCurrency(calc.laserDepreciation)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Custos fixos (rateio):</span>
                      <span className="float-right font-medium">
                        {formatCurrency(calc.fixedCostAllocation)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Custo Total:</span>
                <span className="text-primary">{formatCurrency(calc.totalCost)}</span>
              </div>
            </div>

            {/* Preços Sugeridos */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Estratégia de Preços
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="text-sm text-destructive font-medium mb-1">Preço Mínimo</div>
                  <div className="text-lg font-bold text-destructive">
                    {formatCurrency(calc.minimumPrice)}
                  </div>
                  <div className="text-xs text-muted-foreground">Sem prejuízo</div>
                </div>
                
                <div className="p-4 border border-warning/20 rounded-lg bg-warning/5">
                  <div className="text-sm text-warning font-medium mb-1">Preço Conservador</div>
                  <div className="text-lg font-bold text-warning">
                    {formatCurrency(calc.suggestedMargins[1])}
                  </div>
                  <div className="text-xs text-muted-foreground">Margem 30%</div>
                </div>
                
                <div className="p-4 border border-success/20 rounded-lg bg-success/5">
                  <div className="text-sm text-success font-medium mb-1">Preço Ideal</div>
                  <div className="text-lg font-bold text-success">
                    {formatCurrency(calc.suggestedMargins[3])}
                  </div>
                  <div className="text-xs text-muted-foreground">Margem 50%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[20, 30, 40, 50, 60].map((margin, index) => (
                  <div key={margin} className="text-center p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground">+{margin}%</div>
                    <div className="font-medium text-sm">
                      {formatCurrency(calc.suggestedMargins[index])}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Análise Competitiva */}
            {calc.competitiveAnalysis && (
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Análise Competitiva
                </h4>
                
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Preço de Mercado:</span>
                      <div className="font-semibold">
                        {formatCurrency(calc.competitiveAnalysis.marketPrice)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Nossa Margem:</span>
                      <div className={`font-semibold ${
                        calc.competitiveAnalysis.ourMargin > 20 ? 'text-success' : 
                        calc.competitiveAnalysis.ourMargin > 0 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {formatPercentage(calc.competitiveAnalysis.ourMargin)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>Recomendação:</strong> {calc.competitiveAnalysis.recommendation}
                  </div>
                </div>
              </div>
            )}

            {/* Análise de Precificação */}
            <PricingTable 
              totalCost={calc.totalCost}
              globalSettings={globalSettings}
              productName={calc.productName}
              productType={'materials' in calc ? 'ring' : 'gift'}
            />

            {/* Point Break-even para Anilhas */}
            {'breakEvenQuantity' in calc && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Análise de Break-even</h4>
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="text-sm text-muted-foreground">
                    Quantidade mínima para cobrir custos fixos:
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {calc.breakEvenQuantity} unidades/mês
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};