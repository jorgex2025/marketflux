import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchService } from './search.service';

const mockConfigService = {
  get: vi.fn((key: string, defaultValue: string) => defaultValue),
};

vi.mock('meilisearch', () => ({
  MeiliSearch: vi.fn().mockImplementation(() => ({
    index: vi.fn().mockReturnValue({
      addDocuments: vi.fn(),
      updateDocuments: vi.fn(),
      deleteDocument: vi.fn(),
      deleteAllDocuments: vi.fn(),
      search: vi.fn(),
      updateSettings: vi.fn(),
    }),
    getIndex: vi.fn(),
    createIndex: vi.fn(),
  })),
  Index: vi.fn(),
}));

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SearchService(mockConfigService as any);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería tener método onModuleInit', () => {
    expect(service.onModuleInit).toBeDefined();
    expect(typeof service.onModuleInit).toBe('function');
  });

  it('debería tener método indexProduct', () => {
    expect(service.indexProduct).toBeDefined();
    expect(typeof service.indexProduct).toBe('function');
  });

  it('debería tener método indexProducts', () => {
    expect(service.indexProducts).toBeDefined();
    expect(typeof service.indexProducts).toBe('function');
  });

  it('debería tener método updateProduct', () => {
    expect(service.updateProduct).toBeDefined();
    expect(typeof service.updateProduct).toBe('function');
  });

  it('debería tener método deleteProduct', () => {
    expect(service.deleteProduct).toBeDefined();
    expect(typeof service.deleteProduct).toBe('function');
  });

  it('debería tener método search', () => {
    expect(service.search).toBeDefined();
    expect(typeof service.search).toBe('function');
  });

  it('debería tener método reindexAll', () => {
    expect(service.reindexAll).toBeDefined();
    expect(typeof service.reindexAll).toBe('function');
  });
});
