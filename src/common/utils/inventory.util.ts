import { InventoryStatus } from '../constants/enums';

export function calculateInventoryStatus(quantity: number, minimumStock = 0): InventoryStatus {
  if (quantity <= 0) return InventoryStatus.AGOTADO;
  if (minimumStock > 0 && quantity <= minimumStock) return InventoryStatus.STOCK_BAJO;
  return InventoryStatus.DISPONIBLE;
}

export function calculateTotalQuantity(quantity: number, capacity?: number): number | undefined {
  if (capacity === undefined) return undefined;
  return Number((quantity * capacity).toFixed(4));
}

export function calculateEquivalentUnits(
  quantity: number,
  equivalentUnitsPerItem?: number,
): number | undefined {
  if (equivalentUnitsPerItem === undefined) return undefined;
  return Number((quantity * equivalentUnitsPerItem).toFixed(4));
}
