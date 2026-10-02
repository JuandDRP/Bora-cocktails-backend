import { HttpException, HttpStatus } from '@nestjs/common';

export class DomainException extends HttpException {
  constructor(code: string, message: string, status: HttpStatus, data?: unknown) {
    super({ success: false, code, message, data }, status);
  }
}

export class ProductNotFoundException extends DomainException {
  constructor(id: string) {
    super('PRODUCT_NOT_FOUND', `Producto no encontrado: ${id}`, HttpStatus.NOT_FOUND);
  }
}

export class FlavorNotFoundException extends DomainException {
  constructor(id: string) {
    super('FLAVOR_NOT_FOUND', `Sabor no encontrado: ${id}`, HttpStatus.NOT_FOUND);
  }
}

export class InventoryNotFoundException extends DomainException {
  constructor(id: string) {
    super('INVENTORY_NOT_FOUND', `Inventario no encontrado: ${id}`, HttpStatus.NOT_FOUND);
  }
}

export class InsufficientStockException extends DomainException {
  constructor(available: number, requested: number, unit: string) {
    super(
      'INSUFFICIENT_STOCK',
      `Stock insuficiente. Disponible: ${available} ${unit}.`,
      HttpStatus.CONFLICT,
      { available, requested },
    );
  }
}

export class InvalidSaleException extends DomainException {
  constructor(message: string, data?: unknown) {
    super('INVALID_SALE', message, HttpStatus.BAD_REQUEST, data);
  }
}

export class InvalidInventoryOperationException extends DomainException {
  constructor(message: string, data?: unknown) {
    super('INVALID_INVENTORY_OPERATION', message, HttpStatus.BAD_REQUEST, data);
  }
}

export class IdempotencyKeyRequiredException extends DomainException {
  constructor() {
    super(
      'IDEMPOTENCY_KEY_REQUIRED',
      'El header Idempotency-Key es obligatorio para esta operación.',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class IdempotencyInProgressException extends DomainException {
  constructor() {
    super(
      'IDEMPOTENCY_IN_PROGRESS',
      'El request con la misma clave ya está siendo procesado.',
      HttpStatus.CONFLICT,
    );
  }
}
