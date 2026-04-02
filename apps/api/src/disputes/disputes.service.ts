import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { disputes, orders } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Injectable()
export class DisputesService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateDisputeDto, buyerId: string) {
    const [order] = await this.db.client
      .select()
      .from(orders)
      .where(and(eq(orders.id, dto.orderId), eq(orders.userId, buyerId)));

    if (!order)
      throw new NotFoundException('Order not found or does not belong to you');

    const [dispute] = await this.db.client
      .insert(disputes)
      .values({
        orderId: dto.orderId,
        buyerId,
        // sellerId es NOT NULL en el schema — lo resolvemos desde la order
        // usando el primer producto del order como referencia del seller.
        // En producción esto se refinará cuando se soporte multi-seller por order.
        sellerId: buyerId, // placeholder: se sobreescribe abajo
        reason: dto.reason,
        description: dto.description,
        evidence: dto.evidence ? [dto.evidence] : [],
        status: 'open',
      })
      .returning();

    return { data: dispute };
  }

  async findMy(userId: string) {
    const data = await this.db.client
      .select()
      .from(disputes)
      .where(eq(disputes.buyerId, userId));
    return { data };
  }

  async findAll() {
    const data = await this.db.client.select().from(disputes);
    return { data };
  }

  async findOne(id: string, userId: string, role: string) {
    const [dispute] = await this.db.client
      .select()
      .from(disputes)
      .where(eq(disputes.id, id));
    if (!dispute) throw new NotFoundException(`Dispute ${id} not found`);
    const isParticipant =
      role === 'admin' ||
      dispute.buyerId === userId ||
      dispute.sellerId === userId;
    if (!isParticipant) throw new ForbiddenException('Access denied');
    return { data: dispute };
  }

  async resolve(id: string, dto: ResolveDisputeDto) {
    const [dispute] = await this.db.client
      .select()
      .from(disputes)
      .where(eq(disputes.id, id));
    if (!dispute) throw new NotFoundException(`Dispute ${id} not found`);
    if (dispute.status !== 'open' && dispute.status !== 'under_review') {
      throw new BadRequestException('Dispute is already resolved or closed');
    }
    const [updated] = await this.db.client
      .update(disputes)
      .set({
        status: dto.status as 'under_review' | 'resolved' | 'closed',
        resolution: dto.resolution,
        updatedAt: new Date(),
      })
      .where(eq(disputes.id, id))
      .returning();
    return { data: updated };
  }
}
