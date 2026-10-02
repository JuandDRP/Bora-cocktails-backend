import { SaleComplexity } from '../constants/enums';

export function classifyComplexity(flavorCount: number): SaleComplexity {
  return flavorCount > 1 ? SaleComplexity.COMBINADO : SaleComplexity.SIMPLE;
}

export function calculateLineSubtotal(quantity: number, unitPrice: number): number {
  return Number((quantity * unitPrice).toFixed(2));
}

export function calculateSaleTotal(subtotals: number[]): number {
  return Number(subtotals.reduce((sum, value) => sum + value, 0).toFixed(2));
}
