import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const BYPASS_MAINTENANCE_KEY = 'BYPASS_MAINTENANCE';
export const BypassMaintenance = (): CustomDecorator =>
  SetMetadata(BYPASS_MAINTENANCE_KEY, true);
