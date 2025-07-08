import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Settings, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { GlobalSettings, RingCalculation, GiftCalculation } from "./types";
import { toast } from "@/hooks/use-toast";

interface AlertSettings {
  lowMarginAlert: boolean;
  lowMarginThreshold: number;
  highCostAlert: boolean;
  highCostThreshold: number;
  competitivePriceAlert: boolean;
  competitivePriceThreshold: number;
  laborEfficiencyAlert: boolean;
  laborEfficiencyThreshold: number;
  materialCostAlert: boolean;
  materialCostThreshold: number;
}

interface SmartAlertsProps {
  globalSettings: GlobalSettings;
  calculations: (RingCalculation | GiftCalculation)[];
}

interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  productName: string;
  timestamp: string;
  dismissed: boolean;
}

export const SmartAlerts = ({ globalSettings, calculations }: SmartAlertsProps) => {
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(() => {
    const saved = localStorage.getItem('smartAlertSettings');
    return saved ? JSON.parse(saved) : {
      lowMarginAlert: true,
      lowMarginThreshold: 20,
      highCostAlert: true,
      highCostThreshold: 100,
      competitivePriceAlert: true,
      competitivePriceThreshold: 10,
      laborEfficiencyAlert: true,
      laborEfficiencyThreshold: 120,
      materialCostAlert: true,
      materialCostThreshold: 50
    };
  });

  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    const saved = localStorage.getItem('smartAlerts');
    return saved ? JSON.parse(saved) : [];
  });

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('smartAlertSettings', JSON.stringify(alertSettings));
  }, [alertSettings]);

  useEffect(() => {
    localStorage.setItem('smartAlerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    generateAlerts();
  }, [calculations, alertSettings]);

  const generateAlerts = () => {
    const newAlerts: AlertItem[] = [];
    
    calculations.forEach(calc => {
      const profitMargins = calc.profitMargins || [];
      
      // Alert de margem baixa
      if (alertSettings.lowMarginAlert && profitMargins.length > 0) {
        const lowestMargin = Math.min(...profitMargins.map(p => p.netMarginPercent));
        if (lowestMargin < alertSettings.lowMarginThreshold) {
          newAlerts.push({
            id: `low-margin-${calc.id}`,
            type: 'warning',
            title: 'Margem de Lucro Baixa',
            description: `Margem de ${lowestMargin.toFixed(1)}% está abaixo do limite de ${alertSettings.lowMarginThreshold}%`,
            productName: calc.productName,
            timestamp: new Date().toISOString(),
            dismissed: false
          });
        }
      }

      // Alert de custo alto
      if (alertSettings.highCostAlert && calc.totalCost > alertSettings.highCostThreshold) {
        newAlerts.push({
          id: `high-cost-${calc.id}`,
          type: 'error',
          title: 'Custo Elevado',
          description: `Custo total de R$ ${calc.totalCost.toFixed(2)} está acima do limite de R$ ${alertSettings.highCostThreshold}`,
          productName: calc.productName,
          timestamp: new Date().toISOString(),
          dismissed: false
        });
      }

      // Alert de preço competitivo
      if (alertSettings.competitivePriceAlert && calc.competitiveAnalysis) {
        const marginDiff = calc.competitiveAnalysis.ourMargin;
        if (marginDiff < alertSettings.competitivePriceThreshold) {
          newAlerts.push({
            id: `competitive-price-${calc.id}`,
            type: 'warning',
            title: 'Preço Pouco Competitivo',
            description: `Margem de ${marginDiff.toFixed(1)}% está abaixo do mercado`,
            productName: calc.productName,
            timestamp: new Date().toISOString(),
            dismissed: false
          });
        }
      }

      // Alert de eficiência da mão de obra (apenas para anilhas)
      if (alertSettings.laborEfficiencyAlert && 'labor' in calc) {
        const totalLaborMinutes = calc.labor.reduce((sum, l) => sum + l.minutes, 0);
        if (totalLaborMinutes > alertSettings.laborEfficiencyThreshold) {
          newAlerts.push({
            id: `labor-efficiency-${calc.id}`,
            type: 'info',
            title: 'Tempo de Mão de Obra Alto',
            description: `${totalLaborMinutes} minutos está acima do limite de ${alertSettings.laborEfficiencyThreshold} minutos`,
            productName: calc.productName,
            timestamp: new Date().toISOString(),
            dismissed: false
          });
        }
      }

      // Alert de custo de material (apenas para anilhas)
      if (alertSettings.materialCostAlert && 'materials' in calc) {
        const totalMaterialCost = calc.materials.reduce((sum, m) => sum + (m.quantity * m.unitCost), 0);
        if (totalMaterialCost > alertSettings.materialCostThreshold) {
          newAlerts.push({
            id: `material-cost-${calc.id}`,
            type: 'warning',
            title: 'Custo de Material Alto',
            description: `Custo de R$ ${totalMaterialCost.toFixed(2)} está acima do limite de R$ ${alertSettings.materialCostThreshold}`,
            productName: calc.productName,
            timestamp: new Date().toISOString(),
            dismissed: false
          });
        }
      }
    });

    // Atualizar apenas alertas não existentes
    const existingAlertIds = alerts.map(a => a.id);
    const uniqueNewAlerts = newAlerts.filter(alert => !existingAlertIds.includes(alert.id));
    
    if (uniqueNewAlerts.length > 0) {
      setAlerts(prev => [...prev, ...uniqueNewAlerts]);
      
      // Mostrar toast para novos alertas
      uniqueNewAlerts.forEach(alert => {
        toast({
          title: alert.title,
          description: `${alert.productName}: ${alert.description}`,
          variant: alert.type === 'error' ? 'destructive' : 'default'
        });
      });
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    toast({
      title: "Alertas limpos",
      description: "Todos os alertas foram removidos"
    });
  };

  const updateAlertSetting = (key: keyof AlertSettings, value: boolean | number) => {
    setAlertSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <TrendingDown className="h-4 w-4 text-yellow-500" />;
      case 'info': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.dismissed);

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas Inteligentes
              {activeAlerts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeAlerts.length}
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-6">
          {/* Configurações dos Alertas */}
          {showSettings && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold">Configurações dos Alertas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="low-margin-alert">Alerta de Margem Baixa</Label>
                    <Switch
                      id="low-margin-alert"
                      checked={alertSettings.lowMarginAlert}
                      onCheckedChange={(checked) => updateAlertSetting('lowMarginAlert', checked)}
                    />
                  </div>
                  {alertSettings.lowMarginAlert && (
                    <div className="space-y-2">
                      <Label htmlFor="low-margin-threshold">Limite de Margem (%)</Label>
                      <Input
                        id="low-margin-threshold"
                        type="number"
                        value={alertSettings.lowMarginThreshold}
                        onChange={(e) => updateAlertSetting('lowMarginThreshold', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="high-cost-alert">Alerta de Custo Alto</Label>
                    <Switch
                      id="high-cost-alert"
                      checked={alertSettings.highCostAlert}
                      onCheckedChange={(checked) => updateAlertSetting('highCostAlert', checked)}
                    />
                  </div>
                  {alertSettings.highCostAlert && (
                    <div className="space-y-2">
                      <Label htmlFor="high-cost-threshold">Limite de Custo (R$)</Label>
                      <Input
                        id="high-cost-threshold"
                        type="number"
                        value={alertSettings.highCostThreshold}
                        onChange={(e) => updateAlertSetting('highCostThreshold', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="material-cost-alert">Alerta de Custo de Material</Label>
                    <Switch
                      id="material-cost-alert"
                      checked={alertSettings.materialCostAlert}
                      onCheckedChange={(checked) => updateAlertSetting('materialCostAlert', checked)}
                    />
                  </div>
                  {alertSettings.materialCostAlert && (
                    <div className="space-y-2">
                      <Label htmlFor="material-cost-threshold">Limite de Material (R$)</Label>
                      <Input
                        id="material-cost-threshold"
                        type="number"
                        value={alertSettings.materialCostThreshold}
                        onChange={(e) => updateAlertSetting('materialCostThreshold', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="competitive-price-alert">Alerta de Preço Competitivo</Label>
                    <Switch
                      id="competitive-price-alert"
                      checked={alertSettings.competitivePriceAlert}
                      onCheckedChange={(checked) => updateAlertSetting('competitivePriceAlert', checked)}
                    />
                  </div>
                  {alertSettings.competitivePriceAlert && (
                    <div className="space-y-2">
                      <Label htmlFor="competitive-price-threshold">Limite de Margem (%)</Label>
                      <Input
                        id="competitive-price-threshold"
                        type="number"
                        value={alertSettings.competitivePriceThreshold}
                        onChange={(e) => updateAlertSetting('competitivePriceThreshold', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="labor-efficiency-alert">Alerta de Eficiência da Mão de Obra</Label>
                    <Switch
                      id="labor-efficiency-alert"
                      checked={alertSettings.laborEfficiencyAlert}
                      onCheckedChange={(checked) => updateAlertSetting('laborEfficiencyAlert', checked)}
                    />
                  </div>
                  {alertSettings.laborEfficiencyAlert && (
                    <div className="space-y-2">
                      <Label htmlFor="labor-efficiency-threshold">Limite de Tempo (minutos)</Label>
                      <Input
                        id="labor-efficiency-threshold"
                        type="number"
                        value={alertSettings.laborEfficiencyThreshold}
                        onChange={(e) => updateAlertSetting('laborEfficiencyThreshold', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lista de Alertas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Alertas Ativos</h3>
              {activeAlerts.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearAllAlerts}>
                  Limpar Todos
                </Button>
              )}
            </div>
            
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum alerta ativo</p>
                <p className="text-sm">Seus produtos estão dentro dos parâmetros configurados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <Alert key={alert.id} className={`border-l-4 ${
                    alert.type === 'error' ? 'border-l-red-500' : 
                    alert.type === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type)}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{alert.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {alert.productName}
                            </Badge>
                          </div>
                          <AlertDescription>{alert.description}</AlertDescription>
                          <div className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => dismissAlert(alert.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </Button>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};