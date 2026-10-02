export enum ProductCategory {
  GRANIZADO = 'GRANIZADO',
  TOPPING = 'TOPPING',
  EMPAQUE = 'EMPAQUE',
  OTRO = 'OTRO',
}

export enum ProductType {
  LIQUIDO_GRANIZADO = 'LIQUIDO_GRANIZADO',
  GOMITAS = 'GOMITAS',
  PERLAS = 'PERLAS',
  CHICLES = 'CHICLES',
  VASOS = 'VASOS',
  TAPAS = 'TAPAS',
  PITILLOS = 'PITILLOS',
  JERINGAS = 'JERINGAS',
  OTRO = 'OTRO',
}

export enum FlavorMode {
  CON_LICOR = 'CON_LICOR',
  SIN_LICOR = 'SIN_LICOR',
}

export enum InventoryStatus {
  DISPONIBLE = 'DISPONIBLE',
  STOCK_BAJO = 'STOCK_BAJO',
  AGOTADO = 'AGOTADO',
}

export enum InventoryMovementType {
  ENTRADA = 'ENTRADA',
  CONSUMO = 'CONSUMO',
  AJUSTE = 'AJUSTE',
  DEVOLUCION = 'DEVOLUCION',
}

export enum SaleDetailType {
  VASO = 'VASO',
  JERINGA = 'JERINGA',
}

export enum SaleComplexity {
  SIMPLE = 'SIMPLE',
  COMBINADO = 'COMBINADO',
}

export enum PaymentMethod {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  OTRO = 'OTRO',
}

export enum PricingType {
  VASO = 'VASO',
  JERINGA = 'JERINGA',
}
