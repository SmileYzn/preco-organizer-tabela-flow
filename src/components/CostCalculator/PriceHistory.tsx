import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { History, TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
import { GlobalSettings, RingCalculation, GiftCalculation } from "./types";

interface PriceHistoryProps {
  globalSettings: GlobalSettings;
  calculations: (RingCalculation | GiftCalculation)[];
}

interface PriceEntry {
  id: string;
  productName: string;
  productId: string;
  price: number;
  cost: number;
  margin: number;
  timestamp: string;
  type: 'ring' | 'gift';
}

interface TrendData {
  date: string;
  price: number;
  cost: number;
  margin: number;
}

export const PriceHistory = ({ globalSettings, calculations }: PriceHistoryProps) => {
  const [priceHistory, setPriceHistory] = useState<PriceEntry[]>(() => {
    const saved = localStorage.getItem('priceHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30days');

  useEffect(() => {
    localStorage.setItem('priceHistory', JSON.stringify(priceHistory));
  }, [priceHistory]);

  useEffect(() => {
    // Adicionar novas entradas do histórico quando há novos cálculos
    if (calculations.length === 0) return;
    
    calculations.forEach(calc => {
      const existingEntry = priceHistory.find(
        entry => entry.productId === calc.id && 
        new Date(entry.timestamp).toDateString() === new Date().toDateString()
      );
      
      if (!existingEntry) {
        const bestMargin = calc.profitMargins && calc.profitMargins.length > 0 
          ? Math.max(...calc.profitMargins.map(p => p.netMarginPercent))
          : 0;
        
        const newEntry: PriceEntry = {
          id: Date.now().toString() + calc.id,
          productName: calc.productName,
          productId: calc.id,
          price: calc.minimumPrice,
          cost: calc.totalCost,
          margin: bestMargin,
          timestamp: new Date().toISOString(),
          type: 'materials' in calc ? 'ring' : 'gift'
        };
        
        setPriceHistory(prev => [...prev, newEntry]);
      }
    });
  }, [calculations, priceHistory]);

  const getFilteredHistory = () => {
    let filtered = priceHistory;
    
    // Filtrar por produto
    if (selectedProduct !== 'all') {
      filtered = filtered.filter(entry => entry.productName === selectedProduct);
    }
    
    // Filtrar por período
    const now = new Date();
    const periodDays = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
      '1year': 365
    }[selectedPeriod] || 30;
    
    const cutoffDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    filtered = filtered.filter(entry => new Date(entry.timestamp) >= cutoffDate);
    
    return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getTrendData = (): TrendData[] => {
    const filteredHistory = getFilteredHistory();
    
    return filteredHistory.map(entry => ({
      date: new Date(entry.timestamp).toLocaleDateString('pt-BR'),
      price: entry.price,
      cost: entry.cost,
      margin: entry.margin
    }));
  };

  const getUniqueProducts = () => {
    const products = Array.from(new Set(priceHistory.map(entry => entry.productName)));
    return products.sort();
  };

  const calculateTrend = (data: TrendData[], field: 'price' | 'cost' | 'margin') => {
    if (data.length < 2) return 0;
    
    const first = data[0][field];
    const last = data[data.length - 1][field];
    
    return ((last - first) / first) * 100;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const exportData = () => {
    const filteredHistory = getFilteredHistory();
    const csvContent = [
      ['Data', 'Produto', 'Tipo', 'Preço', 'Custo', 'Margem (%)'].join(','),
      ...filteredHistory.map(entry => [
        new Date(entry.timestamp).toLocaleDateString('pt-BR'),
        entry.productName,
        entry.type === 'ring' ? 'Anilha' : 'Brinde',
        entry.price.toFixed(2),
        entry.cost.toFixed(2),
        entry.margin.toFixed(2)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'historico_precos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const trendData = getTrendData();
  const priceTrend = calculateTrend(trendData, 'price');
  const costTrend = calculateTrend(trendData, 'cost');
  const marginTrend = calculateTrend(trendData, 'margin');

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-primary text-primary-foreground">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Preços
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Produto:</label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os produtos</SelectItem>
                    {getUniqueProducts().map(product => (
                      <SelectItem key={product} value={product}>{product}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Período:</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">7 dias</SelectItem>
                    <SelectItem value="30days">30 dias</SelectItem>
                    <SelectItem value="90days">90 dias</SelectItem>
                    <SelectItem value="1year">1 ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Resumo das Tendências */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tendência de Preços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={priceTrend >= 0 ? "default" : "destructive"}>
                    {priceTrend >= 0 ? '+' : ''}{priceTrend.toFixed(1)}%
                  </Badge>
                  {priceTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : priceTrend < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tendência de Custos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={costTrend <= 0 ? "default" : "destructive"}>
                    {costTrend >= 0 ? '+' : ''}{costTrend.toFixed(1)}%
                  </Badge>
                  {costTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : costTrend < 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tendência de Margem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={marginTrend >= 0 ? "default" : "destructive"}>
                    {marginTrend >= 0 ? '+' : ''}{marginTrend.toFixed(1)}%
                  </Badge>
                  {marginTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : marginTrend < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Tendências */}
          {trendData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolução de Preços e Custos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'margin' ? `${value.toFixed(1)}%` : formatCurrency(value),
                          name === 'price' ? 'Preço' : name === 'cost' ? 'Custo' : 'Margem'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Preço"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cost" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Custo"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="margin" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Margem"
                        yAxisId="right"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado histórico encontrado</p>
              <p className="text-sm">Faça alguns cálculos para começar a acompanhar as tendências</p>
            </div>
          )}

          {/* Tabela de Histórico */}
          {getFilteredHistory().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico Detalhado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border rounded-lg">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 text-left">Data</th>
                        <th className="p-2 text-left">Produto</th>
                        <th className="p-2 text-left">Tipo</th>
                        <th className="p-2 text-left">Preço</th>
                        <th className="p-2 text-left">Custo</th>
                        <th className="p-2 text-left">Margem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredHistory().reverse().map((entry) => (
                        <tr key={entry.id} className="border-t">
                          <td className="p-2">
                            {new Date(entry.timestamp).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-2 font-medium">{entry.productName}</td>
                          <td className="p-2">
                            <Badge variant="outline">
                              {entry.type === 'ring' ? 'Anilha' : 'Brinde'}
                            </Badge>
                          </td>
                          <td className="p-2">{formatCurrency(entry.price)}</td>
                          <td className="p-2">{formatCurrency(entry.cost)}</td>
                          <td className="p-2">
                            <Badge variant={entry.margin >= 20 ? "default" : "destructive"}>
                              {entry.margin.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};