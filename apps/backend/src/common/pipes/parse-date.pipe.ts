import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseDatePipe implements PipeTransform<string, string> {
  private static readonly DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

  transform(value: string): string {
    if (typeof value !== 'string' || !ParseDatePipe.DATE_REGEX.test(value)) {
      throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date value');
    }

    return value;
  }
}
