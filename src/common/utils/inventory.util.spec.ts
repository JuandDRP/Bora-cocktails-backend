import { InventoryStatus } from '../constants/enums';
import { calculateEquivalentUnits, calculateInventoryStatus, calculateTotalQuantity } from './inventory.util';

describe('inventory utils', () => {
  it('marca agotado cuando el stock llega a cero', () => {
    expect(calculateInventoryStatus(0, 1)).toBe(InventoryStatus.AGOTADO);
  });

  it('marca stock bajo cuando cantidad positiva no supera el mínimo', () => {
    expect(calculateInventoryStatus(1, 2)).toBe(InventoryStatus.STOCK_BAJO);
  });

  it('calcula litros consumidos/almacenados', () => {
    expect(calculateTotalQuantity(2, 6)).toBe(12);
  });

  it('calcula equivalencia de unidades de empaque', () => {
    expect(calculateEquivalentUnits(4, 50)).toBe(200);
  });
});
