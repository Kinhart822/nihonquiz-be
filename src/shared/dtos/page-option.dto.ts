import { Order } from '@constants/pagination.constant';
import {
  EnumFieldOptional,
  NumberFieldOption,
  StringFieldOption,
} from '../decorators/field.decorator';

export class PageOptionsDto {
  @StringFieldOption({
    default: 'createdAt',
  })
  readonly orderBy: string = 'createdAt';

  @EnumFieldOptional(() => Order, {
    default: Order.ASC,
  })
  readonly direction: Order = Order.ASC;

  @NumberFieldOption({
    minimum: 1,
    default: 1,
    int: true,
    required: false,
  })
  readonly page: number = 1;

  @NumberFieldOption({
    minimum: 1,
    default: 10,
    int: true,
    required: false,
  })
  readonly limit: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
