import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalSettingsComponent } from "./GlobalSettings";
import { RingCalculator } from "./RingCalculator";
import { GiftCalculator } from "./GiftCalculator";
import { CalculationResults } from "./CalculationResults";
import { ProductManager } from "./ProductManager";
import { ProductTemplates } from "./ProductTemplates";
import { DiscountCalculator } from "./DiscountCalculator";
import { SmartAlerts } from "./SmartAlerts";
import { PriceHistory } from "./PriceHistory";
import { BreakEvenAnalysis } from "./BreakEvenAnalysis";
import { ConfigurationBackup } from "./ConfigurationBackup";
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
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem('globalSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [calculations, setCalculations] = useState<(RingCalculation | GiftCalculation)[]>([]);

  const handleRingCalculation = (calculation: RingCalculation) => {
    setCalculations(prev => [...prev, calculation]);
  };

  const handleGiftCalculation = (calculation: GiftCalculation) => {
    setCalculations(prev => [...prev, calculation]);
  };

  const handleSettingsChange = (settings: GlobalSettings) => {
    setGlobalSettings(settings);
    localStorage.setItem('globalSettings', JSON.stringify(settings));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="rings">Anilhas</TabsTrigger>
          <TabsTrigger value="gifts">Brindes</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="discounts">Descontos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
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
        
        <TabsContent value="products" className="space-y-6">
          <ProductManager globalSettings={globalSettings} />
        </TabsContent>
        
        <TabsContent value="results" className="space-y-6">
          <CalculationResults calculations={calculations} globalSettings={globalSettings} />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <ProductTemplates onTemplateSelect={(template) => {
            // Lógica para aplicar template será implementada
            console.log('Template selecionado:', template);
          }} />
        </TabsContent>
        
        <TabsContent value="discounts" className="space-y-6">
          <DiscountCalculator globalSettings={globalSettings} />
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-6">
          <SmartAlerts globalSettings={globalSettings} calculations={calculations} />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <PriceHistory globalSettings={globalSettings} calculations={calculations} />
        </TabsContent>
        
        <TabsContent value="analysis" className="space-y-6">
          <BreakEvenAnalysis globalSettings={globalSettings} calculations={calculations} />
        </TabsContent>
        
        <TabsContent value="backup" className="space-y-6">
          <ConfigurationBackup 
            globalSettings={globalSettings} 
            onSettingsRestore={handleSettingsChange} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};