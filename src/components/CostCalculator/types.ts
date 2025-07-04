export interface GlobalSettings {
  laborRate: number; // R$ por hora
  laserDepreciationRate: number; // R$ por hora de uso
  monthlyFixedCosts: number; // Custos fixos mensais
  monthlyProduction: number; // Produção estimada mensal para rateio
  taxRegime: 'simples' | 'presumido' | 'real';
  icmsRate: number; // %
  pisRate: number; // %
  cofinsRate: number; // %
  commissionRate: number; // %
  freightRate: number; // % sobre valor ou fixo
}

export interface MaterialCost {
  description: string;
  quantity: number;
  unitCost: number;
  unit: string;
}

export interface OutsourcingCost {
  description: string;
  cost: number;
  supplier?: string;
}

export interface LaborCost {
  description: string;
  hours: number;
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
}

export interface GiftCalculation {
  id: string;
  productName: string;
  description: string;
  
  // Custos
  purchasePrice: number; // Preço de compra em SP
  freight: number; // Frete de SP
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