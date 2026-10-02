import { SalesService } from './sales.service';
import { PricingType, SaleDetailType, SaleComplexity, FlavorMode } from '@/common/constants/enums';

describe('SalesService', () => {
  const model = { findById: jest.fn(), find: jest.fn(), create: jest.fn() } as any;
  const connection = { startSession: jest.fn() } as any;
  const idempotency = { getCompleted: jest.fn(), reserveOrThrow: jest.fn(), markCompleted: jest.fn() } as any;
  const flavors = { findActiveByIds: jest.fn() } as any;
  const pricing = { getActivePrice: jest.fn() } as any;

  it('calcula vaso combinado usando el precio del tamaño', async () => {
    pricing.getActivePrice.mockResolvedValue(15000);
    flavors.findActiveByIds.mockResolvedValue([
      { _id: '1', name: 'Mora azul', mode: FlavorMode.CON_LICOR },
      { _id: '2', name: 'Frutos rojos', mode: FlavorMode.CON_LICOR },
    ]);

    const session = {
      withTransaction: async (fn: () => Promise<void>) => fn(),
      endSession: jest.fn(),
    };
    connection.startSession.mockResolvedValue(session);
    idempotency.getCompleted.mockResolvedValue(null);
    model.create.mockResolvedValue([{ toObject: () => ({ total: 30000 }) }]);

    const service = new SalesService(connection, model, idempotency, flavors, pricing);
    const result = await service.create({
      saleDate: '2026-10-01T19:00:00.000Z',
      details: [{
        type: SaleDetailType.VASO,
        sizeOz: 16,
        mode: FlavorMode.CON_LICOR,
        flavors: [{ flavorId: '1' }, { flavorId: '2' }],
        quantity: 2,
      }],
    }, 'test-key');

    expect(pricing.getActivePrice).toHaveBeenCalledWith(PricingType.VASO, 16, expect.any(Date));
    expect(result).toEqual({ total: 30000 });
  });
});
