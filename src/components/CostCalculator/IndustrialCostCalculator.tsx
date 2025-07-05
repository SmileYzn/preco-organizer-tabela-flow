import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalSettingsComponent } from "./GlobalSettings";
import { RingCalculator } from "./RingCalculator";
import { GiftCalculator } from "./GiftCalculator";
import { CalculationResults } from "./CalculationResults";
import { GlobalSettings, RingCalculation, GiftCalculation } from "./types";

const defaultSettings: GlobalSettings = {
  laborRate: 25.00,
  laserDepreciationRate: 15.00,
  monthlyFixedCosts: 5000.00,
  monthlyProduction: 1000,
  taxRegime: 'simples',
  icmsRate: 18.00,
  pisRate: 1.65,
  cofinsRate: 7.60,
  commissionRate: 5.00,
  freightRate: 3.00
};

export const IndustrialCostCalculator = () => {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(defaultSettings);
  const [calculations, setCalculations] = useState<(RingCalculation | GiftCalculation)[]>([]);

  const handleRingCalculation = (calculation: RingCalculation) => {
    setCalculations(prev => [...prev, calculation]);
  };

  const handleGiftCalculation = (calculation: GiftCalculation) => {
    setCalculations(prev => [...prev, calculation]);
  };

  const handleSettingsChange = (settings: GlobalSettings) => {
    setGlobalSettings(settings);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="rings">Anilhas</TabsTrigger>
          <TabsTrigger value="gifts">Brindes</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="space-y-6">
          <GlobalSettingsComponent 
            settings={globalSettings}
            onSettingsChange={handleSettingsChange}
          />
        </TabsContent>
        
        <TabsContent value="rings" className="space-y-6">
          <RingCalculator
            globalSettings={globalSettings}
            onCalculationSave={handleRingCalculation}
          />
        </TabsContent>
        
        <TabsContent value="gifts" className="space-y-6">
          <GiftCalculator
            globalSettings={globalSettings}
            onCalculationSave={handleGiftCalculation}
          />
        </TabsContent>
        
        <TabsContent value="results" className="space-y-6">
          <CalculationResults calculations={calculations} globalSettings={globalSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
};