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
  const [customerState, setCustomerState] = useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const calculatePricing = (marginPercent: number, customerState?: string): ProfitMargin => {
    // Taxa total de impostos
    const baseTaxRate = globalSettings.taxRegime === 'simples' ? 6.0 : 
                       (globalSettings.icmsRate + globalSettings.pisRate + globalSettings.cofinsRate);
    
    // DIFAL - aplica apenas se configurado e cliente for de estado diferente
    const difalApplies = globalSettings.usesDifal && 
                        customerState && 
                        customerState !== globalSettings.companyState;
    const difalRate = difalApplies ? globalSettings.difalRate : 0;
    
    const totalTaxRate = baseTaxRate;
    
    // Percentuais totais que incidem sobre o preço de venda
    const totalDeductions = totalTaxRate + difalRate + globalSettings.commissionRate + globalSettings.freightRate;
    
    // Preço de venda = Custo Total / (1 - % Deduções - % Margem Desejada)
    const denominator = 1 - (totalDeductions + marginPercent) / 100;
    
    if (denominator <= 0) {
      return {
        marginPercent,
        sellingPrice: 0,
        totalTaxes: 0,
        totalDifal: 0,
        totalCommission: 0,
        totalOutboundFreight: 0,
        netProfit: 0,
        netMarginPercent: 0,
        customerState
      };
    }

    const sellingPrice = totalCost / denominator;
    const totalTaxes = sellingPrice * (totalTaxRate / 100);
    const totalDifal = sellingPrice * (difalRate / 100);
    const totalCommission = sellingPrice * (globalSettings.commissionRate / 100);
    const totalOutboundFreight = sellingPrice * (globalSettings.freightRate / 100);
    const netProfit = sellingPrice - totalCost - totalTaxes - totalDifal - totalCommission - totalOutboundFreight;
    const netMarginPercent = (netProfit / sellingPrice) * 100;

    return {
      marginPercent,
      sellingPrice,
      totalTaxes,
      totalDifal,
      totalCommission,
      totalOutboundFreight,
      netProfit,
      netMarginPercent,
      customerState
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
        {/* Configurações de Precificação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerState">Estado do Cliente (para DIFAL)</Label>
            <Input
              id="customerState"
              value={customerState}
              onChange={(e) => setCustomerState(e.target.value.toUpperCase())}
              placeholder="ex: RJ, MG, RS"
              maxLength={2}
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Deixe vazio para vendas dentro do mesmo estado
            </p>
          </div>
          <div className="space-y-2">
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
          <div className="flex items-end">
            <Button onClick={addCustomMargin} variant="outline" className="w-full">
              Adicionar Margem
            </Button>
          </div>
        </div>

        {/* Tabela de precificação */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Margem Desejada</TableHead>
                <TableHead>Preço de Venda</TableHead>
                <TableHead>Impostos</TableHead>
                <TableHead>DIFAL</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Frete Saída</TableHead>
                <TableHead>Lucro Líquido</TableHead>
                <TableHead>Margem Líquida</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {margins.map((margin) => {
                const pricing = calculatePricing(margin, customerState);
                return (
                  <TableRow key={margin}>
                    <TableCell className="font-medium">{formatPercent(margin)}</TableCell>
                    <TableCell className="font-semibold text-green-700">
                      {formatCurrency(pricing.sellingPrice)}
                    </TableCell>
                    <TableCell>{formatCurrency(pricing.totalTaxes)}</TableCell>
                    <TableCell className={pricing.totalDifal > 0 ? "text-orange-600" : ""}>
                      {formatCurrency(pricing.totalDifal)}
                      {pricing.totalDifal > 0 && <span className="text-xs ml-1">({customerState})</span>}
                    </TableCell>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Custo Total Unitário</div>
            <div className="text-lg font-bold text-primary">{formatCurrency(totalCost)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Preço Mínimo (0% lucro)</div>
            <div className="text-lg font-bold text-orange-600">
              {formatCurrency(calculatePricing(0, customerState).sellingPrice)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Taxa de Impostos</div>
            <div className="text-lg font-bold text-red-600">
              {formatPercent(
                globalSettings.taxRegime === 'simples' ? 6.0 : 
                (globalSettings.icmsRate + globalSettings.pisRate + globalSettings.cofinsRate)
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              DIFAL {customerState && customerState !== globalSettings.companyState ? `(${customerState})` : ''}
            </div>
            <div className="text-lg font-bold text-orange-600">
              {globalSettings.usesDifal && customerState && customerState !== globalSettings.companyState 
                ? formatPercent(globalSettings.difalRate)
                : "0.00%"
              }
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