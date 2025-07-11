export interface GlobalSettings {
  laborRate: number; // R$ por hora
  laserDepreciationRate: number; // R$ por hora de uso
  monthlyFixedCosts: number; // Custos fixos mensais
  monthlyProduction: number; // Produção estimada mensal para rateio
  taxRegime: 'simples' | 'presumido' | 'real';
  
  // Impostos principais
  icmsRate: number; // %
  pisRate: number; // %
  cofinsRate: number; // %
  
  // DIFAL - Diferencial de Alíquota (para venda consumidor final)
  difalRate: number; // %
  usesDifal: boolean; // Se aplica DIFAL nas vendas
  
  // Custos de vendas
  commissionRate: number; // %
  freightRate: number; // % sobre valor ou fixo
  
  // Estado da empresa para cálculo DIFAL
  companyState: string;
}

export interface MaterialCost {
  description: string;
  quantity: number;
  unitCost: number;
  unit: string;
  // Para cálculo de rendimento de tubos
  isAluminumTube?: boolean;
  tubePrice?: number; // R$/metro
  ringHeight?: number; // mm
  cuttingLoss?: number; // %
  calculatedUnitsPerMeter?: number;
}

export interface OutsourcingCost {
  description: string;
  cost: number;
  supplier?: string;
}

export interface LaborCost {
  description: string;
  minutes: number;
  rate?: number; // Se diferente da taxa global
}

export interface RingCalculation {
  id: string;
  productName: string;
  description: string;
  
  // Custos diretos
  materials: MaterialCost[];
  outsourcing: OutsourcingCost[]; // Corte, anodização
  labor: LaborCost[];
  packaging: number;
  inboundFreight: number; // Frete de entrada
  
  // Custos indiretos
  fixedCostAllocation: number; // Calculado automaticamente
  laserDepreciation: number; // Calculado pelas horas
  
  // Cálculos
  totalDirectCost: number;
  totalIndirectCost: number;
  totalCost: number;
  suggestedMargins: number[]; // [20%, 30%, 40%, 50%]
  minimumPrice: number;
  breakEvenQuantity: number;
  
  // Análise de precificação
  profitMargins: ProfitMargin[];
  
  // Análise competitiva
  competitiveAnalysis?: {
    marketPrice: number;
    ourMargin: number;
    recommendation: string;
  };
}

export interface GiftCalculation {
  id: string;
  productName: string;
  description: string;
  
  // Custos
  purchasePrice: number; // Preço de compra em SP
  inboundFreight: number; // Frete de entrada (entrada)
  labor: LaborCost[]; // Apenas gravação
  packaging: number;
  
  // Custos indiretos
  fixedCostAllocation: number;
  laserDepreciation: number;
  
  // Cálculos
  totalCost: number;
  suggestedMargins: number[];
  minimumPrice: number;
  competitiveAnalysis?: {
    marketPrice: number;
    ourMargin: number;
    recommendation: string;
  };
  
  // Análise de precificação
  profitMargins: ProfitMargin[];
}

export interface ProfitMargin {
  marginPercent: number;
  sellingPrice: number;
  totalTaxes: number;
  totalDifal: number;
  totalCommission: number;
  totalOutboundFreight: number;
  netProfit: number;
  netMarginPercent: number;
  customerState?: string; // Estado do cliente para cálculo DIFAL
}

export interface ProfitabilityAnalysis {
  grossMargin: number;
  contributionMargin: number;
  netMargin: number;
  roi: number;
  paybackPeriod: number; // Em meses
  sensitivity: {
    volume: { change: number; impact: number }[];
    cost: { change: number; impact: number }[];
  };
}

export interface SavedProduct {
  id: string;
  type: 'ring' | 'gift';
  productName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  calculation: RingCalculation | GiftCalculation;
}

export interface TubeCalculation {
  tubePrice: number; // R$/metro
  ringHeight: number; // mm
  cuttingLoss: number; // %
  unitsPerMeter: number;
  costPerUnit: number;
}