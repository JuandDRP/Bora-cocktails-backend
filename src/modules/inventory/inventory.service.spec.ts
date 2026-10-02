
import { InventoryService } from './inventory.service';
import { InventoryMovementType, InventoryStatus } from '@/common/constants/enums';

describe('InventoryService', () => {
  const connection = { startSession: jest.fn() } as any;
  const repository = {
    findIdentity: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    atomicIncrement: jest.fn(),
    updateById: jest.fn(),
    findMany: jest.fn(),
  } as any;
  const products = { findActiveById: jest.fn() } as any;
  const flavors = { findById: jest.fn() } as any;
  const movements = { create: jest.fn() } as any;
  const idempotency = { getCompleted: jest.fn(), reserveOrThrow: jest.fn(), markCompleted: jest.fn() } as any;

  const makeService = () => new InventoryService(connection, repository, products, flavors, movements, idempotency);
  const session = {
    withTransaction: async (fn: () => Promise<void>) => fn(),
    endSession: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    connection.startSession.mockResolvedValue(session);
    repository.updateById.mockResolvedValue({
      _id: 'inventory-1',
      toObject: () => ({ quantity: 5 }),
    });
    movements.create.mockResolvedValue({ _id: 'movement-1' });
    products.findActiveById.mockResolvedValue({ _id: 'product-1', minimumStock: 1 });
  });

  it('crea una existencia inicial y registra una entrada', async () => {
    repository.findIdentity.mockResolvedValue(null);
    repository.create.mockResolvedValue({
      _id: 'inventory-1',
      toObject: () => ({ quantity: 3, status: InventoryStatus.DISPONIBLE }),
    });

    const service = makeService();
    const result = await service.create({
      productId: '507f1f77bcf86cd799439011',
      presentation: 'BOLSA',
      capacity: 6,
      capacityUnit: 'L',
      quantity: 3,
      unit: 'BOLSA',
      minimumStock: 1,
    });

    expect(repository.create).toHaveBeenCalled();
    expect(movements.create).toHaveBeenCalledWith(
      expect.objectContaining({ movementType: InventoryMovementType.ENTRADA, previousStock: 0, newStock: 3 }),
      session,
    );
    expect(result).toEqual({ quantity: 3, status: InventoryStatus.DISPONIBLE });
  });

  it('incrementa stock mediante una entrada conservando stock anterior', async () => {
    idempotency.getCompleted.mockResolvedValue(null);
    repository.findIdentity.mockResolvedValue({
      _id: 'inventory-1',
      quantity: 3,
      minimumStock: 1,
      equivalentUnitsPerItem: undefined,
    });
    repository.atomicIncrement.mockResolvedValue({
      _id: 'inventory-1',
      quantity: 5,
      toObject: () => ({ quantity: 5 }),
    });

    const service = makeService();
    const result = await service.registerEntry({
      productId: '507f1f77bcf86cd799439011',
      presentation: 'BOLSA',
      capacity: 6,
      capacityUnit: 'L',
      quantity: 2,
      unit: 'BOLSA',
    }, 'entry-1');

    expect(repository.atomicIncrement).toHaveBeenCalled();
    expect(movements.create).toHaveBeenCalledWith(
      expect.objectContaining({ previousStock: 3, newStock: 5, quantity: 2 }),
      session,
    );
    expect(idempotency.markCompleted).toHaveBeenCalled();
    expect(result).toHaveProperty('inventory');
  });
});
