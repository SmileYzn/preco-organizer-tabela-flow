import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";
import { GlobalSettings } from "./types";
import { toast } from "@/hooks/use-toast";

interface GlobalSettingsProps {
  settings: GlobalSettings;
  onSettingsChange: (settings: GlobalSettings) => void;
}

export const GlobalSettingsComponent = ({ settings, onSettingsChange }: GlobalSettingsProps) => {
  const [localSettings, setLocalSettings] = useState<GlobalSettings>(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    toast({
      title: "Configurações salvas",
      description: "As configurações globais foram atualizadas com sucesso!",
    });
  };

  const updateSetting = (key: keyof GlobalSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="bg-gradient-primary text-primary-foreground">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações Globais do Negócio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Custos Operacionais */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Custos Operacionais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="laborRate">Taxa de Mão de Obra (R$/hora)</Label>
              <Input
                id="laborRate"
                type="number"
                step="0.01"
                value={localSettings.laborRate}
                onChange={(e) => updateSetting('laborRate', parseFloat(e.target.value) || 0)}
                placeholder="ex: 25.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="laserDepreciation">Depreciação Laser (R$/hora)</Label>
              <Input
                id="laserDepreciation"
                type="number"
                step="0.01"
                value={localSettings.laserDepreciationRate}
                onChange={(e) => updateSetting('laserDepreciationRate', parseFloat(e.target.value) || 0)}
                placeholder="ex: 15.00"
              />
            </div>
          </div>
        </div>

        {/* Custos Fixos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Rateio de Custos Fixos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyFixed">Custos Fixos Mensais (R$)</Label>
              <Input
                id="monthlyFixed"
                type="number"
                step="0.01"
                value={localSettings.monthlyFixedCosts}
                onChange={(e) => updateSetting('monthlyFixedCosts', parseFloat(e.target.value) || 0)}
                placeholder="ex: 5000.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyProduction">Produção Mensal Estimada (unidades)</Label>
              <Input
                id="monthlyProduction"
                type="number"
                value={localSettings.monthlyProduction}
                onChange={(e) => updateSetting('monthlyProduction', parseInt(e.target.value) || 0)}
                placeholder="ex: 1000"
              />
            </div>
          </div>
        </div>

        {/* Regime Tributário */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Regime Tributário</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxRegime">Regime Tributário</Label>
              <Select
                value={localSettings.taxRegime}
                onValueChange={(value: 'simples' | 'presumido' | 'real') => updateSetting('taxRegime', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples">Simples Nacional</SelectItem>
                  <SelectItem value="presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icms">ICMS (%)</Label>
              <Input
                id="icms"
                type="number"
                step="0.01"
                value={localSettings.icmsRate}
                onChange={(e) => updateSetting('icmsRate', parseFloat(e.target.value) || 0)}
                placeholder="ex: 18.00"
              />
            </div>
          </div>
          
          {localSettings.taxRegime !== 'simples' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pis">PIS (%)</Label>
                <Input
                  id="pis"
                  type="number"
                  step="0.01"
                  value={localSettings.pisRate}
                  onChange={(e) => updateSetting('pisRate', parseFloat(e.target.value) || 0)}
                  placeholder="ex: 1.65"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cofins">COFINS (%)</Label>
                <Input
                  id="cofins"
                  type="number"
                  step="0.01"
                  value={localSettings.cofinsRate}
                  onChange={(e) => updateSetting('cofinsRate', parseFloat(e.target.value) || 0)}
                  placeholder="ex: 7.60"
                />
              </div>
            </div>
          )}
        </div>

        {/* Vendas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Custos de Vendas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commission">Comissão de Vendas (%)</Label>
              <Input
                id="commission"
                type="number"
                step="0.01"
                value={localSettings.commissionRate}
                onChange={(e) => updateSetting('commissionRate', parseFloat(e.target.value) || 0)}
                placeholder="ex: 5.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freight">Frete de Entrega - Saída (%)</Label>
              <Input
                id="freight"
                type="number"
                step="0.01"
                value={localSettings.freightRate}
                onChange={(e) => updateSetting('freightRate', parseFloat(e.target.value) || 0)}
                placeholder="ex: 3.00"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};