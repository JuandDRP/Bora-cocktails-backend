
import { ConsumptionService } from './consumption.service';
import { FlavorMode, InventoryStatus, InventoryMovementType } from '@/common/constants/enums';
import { InsufficientStockException } from '@/common/exceptions/domain.exceptions';

describe('ConsumptionService', () => {
  const connection = { startSession: jest.fn() } as any;
  const model = { create: jest.fn(), find: jest.fn() } as any;
  const inventoryService = { resolveIdentity: jest.fn() } as any;
  const inventoryRepository = { atomicIncrement: jest.fn(), updateById: jest.fn(), findById: jest.fn() } as any;
  const movements = { create: jest.fn() } as any;
  const idempotency = { getCompleted: jest.fn(), reserveOrThrow: jest.fn(), markCompleted: jest.fn() } as any;

  const session = { withTransaction: async (fn: () => Promise<void>) => fn(), endSession: jest.fn() };
  const service = () => new ConsumptionService(connection, model, inventoryService, inventoryRepository, movements, idempotency);

  beforeEach(() => {
    jest.clearAllMocks();
    connection.startSession.mockResolvedValue(session);
    idempotency.getCompleted.mockResolvedValue(null);
    movements.create.mockResolvedValue({ _id: 'movement-1' });
    inventoryRepository.updateById.mockResolvedValue(null);
  });

  it('descuenta consumo parcial y calcula litros', async () => {
    inventoryService.resolveIdentity.mockResolvedValue({
      _id: 'inventory-1', productId: 'product-1', flavorId: 'flavor-1', mode: FlavorMode.CON_LICOR,
      presentation: 'BOLSA', capacity: 6, capacityUnit: 'L', quantity: 3, unit: 'BOLSA', minimumStock: 1,
      equivalentUnitsPerItem: undefined,
    });
    inventoryRepository.atomicIncrement.mockResolvedValue({
      _id: 'inventory-1', quantity: 1, toObject: () => ({ quantity: 1 }),
    });
    model.create.mockResolvedValue([{ toObject: () => ({ quantity: 2, totalConsumed: 12 }) }]);

    const result = await service().create({
      consumptionDate: '2026-10-01',
      productId: '507f1f77bcf86cd799439011',
      flavorId: '507f1f77bcf86cd799439012',
      mode: FlavorMode.CON_LICOR,
      presentation: 'BOLSA',
      capacity: 6,
      capacityUnit: 'L',
      quantity: 2,
      unit: 'BOLSA',
    }, 'consumption-1');

    expect(inventoryRepository.atomicIncrement).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: { $gte: 2 } }),
      -2,
      expect.objectContaining({ totalQuantity: -12 }),
      {},
      session,
      false,
    );
    expect(movements.create).toHaveBeenCalledWith(
      expect.objectContaining({ movementType: InventoryMovementType.CONSUMO, previousStock: 3, newStock: 1, totalQuantity: 12 }),
      session,
    );
    expect(result).toHaveProperty('consumption');
  });

  it('rechaza consumo superior al stock disponible', async () => {
    inventoryService.resolveIdentity.mockResolvedValue({
      _id: 'inventory-1', productId: 'product-1', presentation: 'BOLSA', capacity: 6, capacityUnit: 'L', quantity: 3, unit: 'BOLSA', minimumStock: 1,
    });

    await expect(service().create({
      consumptionDate: '2026-10-01',
      productId: '507f1f77bcf86cd799439011',
      presentation: 'BOLSA',
      capacity: 6,
      capacityUnit: 'L',
      quantity: 4,
      unit: 'BOLSA',
    }, 'consumption-2')).rejects.toBeInstanceOf(InsufficientStockException);

    expect(inventoryRepository.atomicIncrement).not.toHaveBeenCalled();
  });
});
