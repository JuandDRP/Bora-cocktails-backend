import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException({
        success: false,
        code: 'INVALID_OBJECT_ID',
        message: `ObjectId inválido: ${value}`,
      });
    }
    return value;
  }
}
