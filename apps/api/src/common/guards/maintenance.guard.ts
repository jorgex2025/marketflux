import { CanActivate, Injectable } from '@nestjs/common';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  canActivate(): boolean {
    // TODO: Fase 2 — leer marketplace_config.maintenance_mode
    return true;
  }
}
