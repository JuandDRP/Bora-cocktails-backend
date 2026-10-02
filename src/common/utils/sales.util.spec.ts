import { SaleComplexity } from '../constants/enums';
import { calculateLineSubtotal, calculateSaleTotal, classifyComplexity } from './sales.util';

describe('sales utils', () => {
  it('clasifica simple y combinado', () => {
    expect(classifyComplexity(1)).toBe(SaleComplexity.SIMPLE);
    expect(classifyComplexity(2)).toBe(SaleComplexity.COMBINADO);
  });

  it('calcula subtotal y total', () => {
    expect(calculateLineSubtotal(4, 3000)).toBe(12000);
    expect(calculateSaleTotal([12000, 15000])).toBe(27000);
  });
});
