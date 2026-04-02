import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { shippingZones, shippingMethods, shipments } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';
import { UpdateShippingZoneDto } from './dto/update-shipping-zone.dto';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from './dto/update-shipping-method.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

@Injectable()
export class ShippingService {
  constructor(private readonly db: DatabaseService) {}

  // ── Zones ────────────────────────────────────────────────────────────
  async findAllZones() {
    const data = await this.db.client.select().from(shippingZones);
    return { data };
  }

  async createZone(dto: CreateShippingZoneDto) {
    const [zone] = await this.db.client
      .insert(shippingZones)
      .values(dto)
      .returning();
    return { data: zone };
  }

  async updateZone(id: string, dto: UpdateShippingZoneDto) {
    const [zone] = await this.db.client
      .update(shippingZones)
      .set(dto)
      .where(eq(shippingZones.id, id))
      .returning();
    if (!zone) throw new NotFoundException(`Shipping zone ${id} not found`);
    return { data: zone };
  }

  // ── Methods ──────────────────────────────────────────────────────────
  async findMethods(country?: string) {
    const query = this.db.client.select().from(shippingMethods);
    const data = country
      ? await this.db.client
          .select()
          .from(shippingMethods)
          .where(eq(shippingMethods.countries, country))
      : await query;
    return { data };
  }

  async createMethod(dto: CreateShippingMethodDto) {
    const [method] = await this.db.client
      .insert(shippingMethods)
      .values(dto)
      .returning();
    return { data: method };
  }

  async updateMethod(id: string, dto: UpdateShippingMethodDto) {
    const [method] = await this.db.client
      .update(shippingMethods)
      .set(dto)
      .where(eq(shippingMethods.id, id))
      .returning();
    if (!method) throw new NotFoundException(`Shipping method ${id} not found`);
    return { data: method };
  }

  // ── Shipments ────────────────────────────────────────────────────────
  async findShipments(userId: string, role: string) {
    const data =
      role === 'admin'
        ? await this.db.client.select().from(shipments)
        : await this.db.client
            .select()
            .from(shipments)
            .where(eq(shipments.sellerId, userId));
    return { data };
  }

  async createShipment(dto: CreateShipmentDto, sellerId: string) {
    const [shipment] = await this.db.client
      .insert(shipments)
      .values({ ...dto, sellerId })
      .returning();
    return { data: shipment };
  }

  async updateShipment(
    id: string,
    dto: UpdateShipmentDto,
    userId: string,
    role: string,
  ) {
    const [existing] = await this.db.client
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));
    if (!existing) throw new NotFoundException(`Shipment ${id} not found`);
    if (role !== 'admin' && existing.sellerId !== userId) {
      throw new ForbiddenException('Not your shipment');
    }
    const [updated] = await this.db.client
      .update(shipments)
      .set(dto)
      .where(eq(shipments.id, id))
      .returning();
    return { data: updated };
  }

  async trackShipment(trackingNumber: string) {
    const [shipment] = await this.db.client
      .select()
      .from(shipments)
      .where(eq(shipments.trackingNumber, trackingNumber));
    if (!shipment)
      throw new NotFoundException(
        `No shipment with tracking number ${trackingNumber}`,
      );
    return { data: shipment };
  }
}
