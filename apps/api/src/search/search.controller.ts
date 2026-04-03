import { Controller, Get, Post, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchProductsDto } from './dto/search-products.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('products')
  async searchProducts(@Query() dto: SearchProductsDto) {
    return this.searchService.search(dto);
  }

  @Post('reindex')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerReindex() {
    // Este endpoint es llamado internamente por admin o scripts de seed.
    // En producción agregar RolesGuard(['admin']).
    return { message: 'Reindex encolado — usar el endpoint interno de productos' };
  }
}
