import { Order } from '@constants/pagination.constant';
import { ApiProperty } from '@nestjs/swagger';
import { EnumFieldOptional } from '@shared/decorators/field.decorator';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import { IsOptional, IsString } from 'class-validator';

export class ConfigContentDto {
  @IsString()
  @ApiProperty({
    type: String,
    description: 'Key',
    example: 'key',
    required: true,
  })
  key!: string;

  @IsString()
  @ApiProperty({
    type: String,
    description: 'Value',
    example: 'value',
    required: true,
  })
  value!: string;
}

export class CreateConfigRequestDto extends ConfigContentDto {}

export class UpdateConfigRequestDto extends ConfigContentDto {}

export class DeleteConfigRequestDto {
  @IsString()
  @ApiProperty({
    type: String,
    description: 'Key',
    example: 'key',
    required: true,
  })
  key!: string;
}

export class SystemConfigFilterDto extends PageOptionsDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Search by keyword in key',
    required: false,
    type: String,
  })
  readonly keyword?: string;

  @EnumFieldOptional(() => Order, {
    default: Order.DESC,
  })
  readonly direction: Order = Order.DESC;
}
