import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('reviews')
@UseGuards(AuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('product/:productId')
  listByProduct(
    @Param('productId') productId: string,
    @Query('rating') rating?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.reviewsService.listByProduct(
      productId,
      rating ? Number(rating) : undefined,
      Number(page),
      Number(limit),
    );
  }

  @Post()
  @Roles('buyer', 'seller', 'admin')
  create(@Request() req: Express.Request & { user: { id: string } }, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Request() req: Express.Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: Partial<CreateReviewDto>,
  ) {
    return this.reviewsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(
    @Request() req: Express.Request & { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.reviewsService.remove(req.user.id, id);
  }

  @Post(':id/reply')
  @Roles('seller', 'admin')
  reply(
    @Request() req: Express.Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.reviewsService.addReply(req.user.id, id, dto);
  }

  @Post(':id/helpful')
  helpful(
    @Request() req: Express.Request & { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.reviewsService.toggleHelpful(req.user.id, id);
  }

  @Get('pending')
  @Roles('admin')
  listPending(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.reviewsService.listPending(Number(page), Number(limit));
  }

  @Patch(':id/moderate')
  @Roles('admin')
  moderate(
    @Request() req: Express.Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderate(req.user.id, id, dto);
  }
}
