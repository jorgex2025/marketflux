/** Revenue data point returned by GET /analytics/revenue-by-day */
export interface RevenueByDay {
  date: string;   // ISO date 'YYYY-MM-DD'
  revenue: number;
  orders: number;
}

/** GMV summary returned by GET /analytics/gmv */
export interface GmvSummary {
  gmv: number;
  totalOrders: number;
  totalSellers: number;
  averageOrderValue: number;
  period: 'day' | 'week' | 'month' | 'year';
}

/** Single audit log entry */
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

/** Platform config entry */
export interface PlatformConfig {
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}
