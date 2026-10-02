import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { connect, Connection, Model, Types } from 'mongoose';
import { Inventory, InventoryDocument, InventorySchema } from '../src/modules/inventory/schemas/inventory.schema';
import { InventoryMovement, InventoryMovementDocument, InventoryMovementSchema } from '../src/modules/inventory-movements/schemas/inventory-movement.schema';
import { InventoryStatus } from '../src/common/constants/enums';

jest.setTimeout(120000);

describe('inventory integration', () => {
  let replSet: MongoMemoryReplSet;
  let connection: Connection;
  let InventoryModel: Model<InventoryDocument>;
  let MovementModel: Model<InventoryMovementDocument>;

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    connection = (await connect(replSet.getUri())).connection;
    InventoryModel = connection.model<Inventory, InventoryDocument>('InventoryIntegration', InventorySchema, 'inventory_integration');
    MovementModel = connection.model<InventoryMovement, InventoryMovementDocument>('InventoryMovementIntegration', InventoryMovementSchema, 'inventory_movements_integration');
  });

  afterEach(async () => {
    await InventoryModel.deleteMany({});
    await MovementModel.deleteMany({});
  });

  afterAll(async () => {
    await connection.close();
    await replSet.stop();
  });

  it('permite presentación/capacidad separadas y registra movimiento transaccional', async () => {
    const session = await connection.startSession();
    try {
      await session.withTransaction(async () => {
        const created = await InventoryModel.create([{
          productId: new Types.ObjectId(),
          flavorId: new Types.ObjectId(),
          mode: 'CON_LICOR',
          presentation: 'BOLSA',
          capacity: 6,
          capacityUnit: 'L',
          quantity: 3,
          unit: 'BOLSA',
          totalQuantity: 18,
          minimumStock: 1,
          status: InventoryStatus.DISPONIBLE,
        }], { session });
        await MovementModel.create([{
          inventoryId: created[0]._id,
          productId: created[0].productId,
          flavorId: created[0].flavorId,
          mode: 'CON_LICOR',
          movementType: 'ENTRADA',
          quantity: 3,
          previousStock: 0,
          newStock: 3,
          unit: 'BOLSA',
          movementDate: new Date(),
        }], { session });
      });
    } finally {
      await session.endSession();
    }

    expect(await InventoryModel.countDocuments()).toBe(1);
    expect(await MovementModel.countDocuments()).toBe(1);
  });

  it('no permite duplicar la misma identidad por índice único', async () => {
    const identity = {
      productId: new Types.ObjectId(),
      flavorId: new Types.ObjectId(),
      mode: 'SIN_LICOR',
      presentation: 'BOLSA',
      capacity: 8,
      capacityUnit: 'L',
    };
    await InventoryModel.create({ ...identity, quantity: 2, unit: 'BOLSA', status: InventoryStatus.DISPONIBLE });
    await expect(InventoryModel.create({ ...identity, quantity: 1, unit: 'BOLSA', status: InventoryStatus.DISPONIBLE })).rejects.toMatchObject({ code: 11000 });
  });
});
