import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Download } from "lucide-react";
import { GlobalSettings, ProfitMargin } from "./types";
import * as XLSX from 'xlsx';

interface PricingTableProps {
  totalCost: number;
  globalSettings: GlobalSettings;
  productName: string;
  productType: "ring" | "gift";
}

export const PricingTable = ({ totalCost, globalSettings, productName, productType }: PricingTableProps) => {
  const [margins, setMargins] = useState([10, 20, 30, 50, 100]);
  const [customMargin, setCustomMargin] = useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const calculatePricing = (marginPercent: number): ProfitMargin => {
    // Taxa total de impostos
    const totalTaxRate = globalSettings.taxRegime === 'simples' ? 6.0 : 
                        (globalSettings.icmsRate + globalSettings.pisRate + globalSettings.cofinsRate);
    
    // Percentuais totais que incidem sobre o preço de venda
    const totalDeductions = totalTaxRate + globalSettings.commissionRate + globalSettings.freightRate;
    
    // Preço de venda = Custo Total / (1 - % Deduções - % Margem Desejada)
    const denominator = 1 - (totalDeductions + marginPercent) / 100;
    
    if (denominator <= 0) {
      return {
        marginPercent,
        sellingPrice: 0,
        totalTaxes: 0,
        totalCommission: 0,
        totalOutboundFreight: 0,
        netProfit: 0,
        netMarginPercent: 0
      };
    }

    const sellingPrice = totalCost / denominator;
    const totalTaxes = sellingPrice * (totalTaxRate / 100);
    const totalCommission = sellingPrice * (globalSettings.commissionRate / 100);
    const totalOutboundFreight = sellingPrice * (globalSettings.freightRate / 100);
    const netProfit = sellingPrice - totalCost - totalTaxes - totalCommission - totalOutboundFreight;
    const netMarginPercent = (netProfit / sellingPrice) * 100;

    return {
      marginPercent,
      sellingPrice,
      totalTaxes,
      totalCommission,
      totalOutboundFreight,
      netProfit,
      netMarginPercent
    };
  };

  const addCustomMargin = () => {
    const margin = parseFloat(customMargin);
    if (margin > 0 && !margins.includes(margin)) {
      setMargins([...margins, margin].sort((a, b) => a - b));
      setCustomMargin("");
    }
  };

  const removeMargin = (marginToRemove: number) => {
    setMargins(margins.filter(m => m !== marginToRemove));
  };

  const exportToExcel = () => {
    const pricingData = margins.map(margin => {
      const pricing = calculatePricing(margin);
      return {
        'Margem Desejada (%)': margin,
        'Preço de Venda (R$)': pricing.sellingPrice.toFixed(2),
        'Custo Total (R$)': totalCost.toFixed(2),
        'Impostos (R$)': pricing.totalTaxes.toFixed(2),
        'Comissão (R$)': pricing.totalCommission.toFixed(2),
        'Frete Saída (R$)': pricing.totalOutboundFreight.toFixed(2),
        'Lucro Líquido (R$)': pricing.netProfit.toFixed(2),
        'Margem Líquida (%)': pricing.netMarginPercent.toFixed(2)
      };
    });

    const configData = [{
      'Taxa de Mão de Obra (R$/h)': globalSettings.laborRate,
      'Depreciação Laser (R$/h)': globalSettings.laserDepreciationRate,
      'Custos Fixos Mensais (R$)': globalSettings.monthlyFixedCosts,
      'Produção Mensal Estimada': globalSettings.monthlyProduction,
      'Regime Tributário': globalSettings.taxRegime,
      'ICMS (%)': globalSettings.icmsRate,
      'PIS (%)': globalSettings.pisRate,
      'COFINS (%)': globalSettings.cofinsRate,
      'Comissão (%)': globalSettings.commissionRate,
      'Frete Saída (%)': globalSettings.freightRate
    }];

    const wb = XLSX.utils.book_new();
    
    // Aba de configurações
    const configWs = XLSX.utils.json_to_sheet(configData);
    XLSX.utils.book_append_sheet(wb, configWs, 'Configurações');
    
    // Aba de precificação
    const pricingWs = XLSX.utils.json_to_sheet(pricingData);
    XLSX.utils.book_append_sheet(wb, pricingWs, 'Precificação');

    const filename = `Precificacao_${productName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="bg-gradient-primary text-primary-foreground">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tabela de Precificação Multiplicadora
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Adicionar margem personalizada */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="customMargin">Adicionar Margem Personalizada (%)</Label>
            <Input
              id="customMargin"
              type="number"
              step="0.1"
              value={customMargin}
              onChange={(e) => setCustomMargin(e.target.value)}
              placeholder="ex: 75"
            />
          </div>
          <Button onClick={addCustomMargin} variant="outline">
            Adicionar
          </Button>
        </div>

        {/* Tabela de precificação */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Margem Desejada</TableHead>
                <TableHead>Preço de Venda</TableHead>
                <TableHead>Impostos</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Frete Saída</TableHead>
                <TableHead>Lucro Líquido</TableHead>
                <TableHead>Margem Líquida</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {margins.map((margin) => {
                const pricing = calculatePricing(margin);
                return (
                  <TableRow key={margin}>
                    <TableCell className="font-medium">{formatPercent(margin)}</TableCell>
                    <TableCell className="font-semibold text-green-700">
                      {formatCurrency(pricing.sellingPrice)}
                    </TableCell>
                    <TableCell>{formatCurrency(pricing.totalTaxes)}</TableCell>
                    <TableCell>{formatCurrency(pricing.totalCommission)}</TableCell>
                    <TableCell>{formatCurrency(pricing.totalOutboundFreight)}</TableCell>
                    <TableCell className="font-semibold text-blue-700">
                      {formatCurrency(pricing.netProfit)}
                    </TableCell>
                    <TableCell>{formatPercent(pricing.netMarginPercent)}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => removeMargin(margin)}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Resumo de custos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Custo Total Unitário</div>
            <div className="text-lg font-bold text-primary">{formatCurrency(totalCost)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Preço Mínimo (0% lucro)</div>
            <div className="text-lg font-bold text-orange-600">
              {formatCurrency(calculatePricing(0).sellingPrice)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Taxa Total de Deduções</div>
            <div className="text-lg font-bold text-red-600">
              {formatPercent(
                (globalSettings.taxRegime === 'simples' ? 6.0 : 
                 (globalSettings.icmsRate + globalSettings.pisRate + globalSettings.cofinsRate)) +
                globalSettings.commissionRate + globalSettings.freightRate
              )}
            </div>
          </div>
        </div>

        {/* Botão de exportação */}
        <div className="flex justify-end">
          <Button onClick={exportToExcel} className="bg-gradient-primary hover:opacity-90">
            <Download className="h-4 w-4 mr-2" />
            Exportar para Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};