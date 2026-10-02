import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const raw = typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>)
        : { message: String(exceptionResponse) };
      if (raw.success === false) {
        response.status(status).json(raw);
        return;
      }
      const message = Array.isArray(raw.message) ? raw.message.join('; ') : String(raw.message ?? 'Error HTTP');
      response.status(status).json({
        success: false,
        code: status === HttpStatus.BAD_REQUEST ? 'VALIDATION_ERROR' : 'HTTP_ERROR',
        message,
        data: raw.data ?? null,
      });
      return;
    }

    const errorObject = exception as Record<string, unknown>;
    if (errorObject?.name === 'MongoServerError' && errorObject.code === 11000) {
      response.status(HttpStatus.CONFLICT).json({
        success: false,
        code: 'DUPLICATE_KEY',
        message: 'Ya existe un registro con la misma combinación única.',
        data: errorObject.keyValue ?? null,
      });
      return;
    }

    if (errorObject?.name === 'ValidationError' || errorObject?.name === 'CastError') {
      response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: errorObject.name === 'CastError' ? 'INVALID_VALUE' : 'MONGOOSE_VALIDATION_ERROR',
        message: exception instanceof Error ? exception.message : 'Datos inválidos.',
      });
      return;
    }

    const message = exception instanceof Error ? exception.message : 'Error interno del servidor';
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message,
    });
  }
}
