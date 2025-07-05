import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, AlertCircle } from "lucide-react";
import { TubeCalculation } from "./types";

interface TubeCalculatorProps {
  onCalculationChange: (calculation: TubeCalculation) => void;
  initialValues?: {
    tubePrice: number;
    ringHeight: number;
    cuttingLoss: number;
  };
}

export const TubeCalculator = ({ onCalculationChange, initialValues }: TubeCalculatorProps) => {
  const [tubePrice, setTubePrice] = useState(initialValues?.tubePrice || 0);
  const [ringHeight, setRingHeight] = useState(initialValues?.ringHeight || 3);
  const [cuttingLoss, setCuttingLoss] = useState(initialValues?.cuttingLoss || 5);

  const calculateTube = (): TubeCalculation => {
    if (ringHeight <= 0) {
      return {
        tubePrice,
        ringHeight,
        cuttingLoss,
        unitsPerMeter: 0,
        costPerUnit: 0
      };
    }

    // Comprimento efetivo por metro (considerando a perda)
    const effectiveLength = 1000 * (1 - cuttingLoss / 100); // mm
    
    // Quantidade de anilhas por metro (arredondado para baixo)
    const unitsPerMeter = Math.floor(effectiveLength / ringHeight);
    
    // Custo por anilha
    const costPerUnit = unitsPerMeter > 0 ? tubePrice / unitsPerMeter : 0;

    return {
      tubePrice,
      ringHeight,
      cuttingLoss,
      unitsPerMeter,
      costPerUnit
    };
  };

  useEffect(() => {
    const calculation = calculateTube();
    onCalculationChange(calculation);
  }, [tubePrice, ringHeight, cuttingLoss, onCalculationChange]);

  const calculation = calculateTube();
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Calculator className="h-4 w-4" />
          Calculadora de Rendimento - Tubo de Alumínio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tubePrice">Preço do Tubo (R$/metro)</Label>
            <Input
              id="tubePrice"
              type="number"
              step="0.01"
              value={tubePrice}
              onChange={(e) => setTubePrice(parseFloat(e.target.value) || 0)}
              placeholder="ex: 45.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ringHeight">Altura da Anilha (mm)</Label>
            <Input
              id="ringHeight"
              type="number"
              step="0.1"
              value={ringHeight}
              onChange={(e) => setRingHeight(parseFloat(e.target.value) || 0)}
              placeholder="ex: 3.0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cuttingLoss">Perda no Corte (%)</Label>
            <Input
              id="cuttingLoss"
              type="number"
              step="0.1"
              value={cuttingLoss}
              onChange={(e) => setCuttingLoss(parseFloat(e.target.value) || 0)}
              placeholder="ex: 5.0"
            />
          </div>
        </div>

        {/* Resultados */}
        <div className="border-t border-blue-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-sm text-muted-foreground">Comprimento Efetivo</div>
              <div className="text-lg font-semibold text-blue-700">
                {(1000 * (1 - cuttingLoss / 100)).toFixed(0)}mm
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-sm text-muted-foreground">Anilhas por Metro</div>
              <div className="text-lg font-semibold text-green-700">
                {calculation.unitsPerMeter} unidades
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-sm text-muted-foreground">Custo por Anilha</div>
              <div className="text-lg font-semibold text-primary">
                {formatCurrency(calculation.costPerUnit)}
              </div>
            </div>
          </div>
          
          {ringHeight <= 0 && (
            <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">
                Informe a altura da anilha para calcular o rendimento
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};