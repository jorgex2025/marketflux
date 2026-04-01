import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseUuidPipe implements PipeTransform {
  transform(value: unknown): string {
    if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/.test(value)) {
      throw new BadRequestException('Invalid UUID');
    }
    return value;
  }
}
