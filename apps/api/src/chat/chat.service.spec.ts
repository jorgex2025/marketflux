import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from './chat.service';

const mockDrizzleService = {
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
};

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ChatService(mockDrizzleService as any);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería tener método createConversation', () => {
    expect(service.createConversation).toBeDefined();
    expect(typeof service.createConversation).toBe('function');
  });

  it('debería tener método getConversations', () => {
    expect(service.getConversations).toBeDefined();
    expect(typeof service.getConversations).toBe('function');
  });

  it('debería tener método getConversationById', () => {
    expect(service.getConversationById).toBeDefined();
    expect(typeof service.getConversationById).toBe('function');
  });

  it('debería tener método sendMessage', () => {
    expect(service.sendMessage).toBeDefined();
    expect(typeof service.sendMessage).toBe('function');
  });

  it('debería tener método getMessages', () => {
    expect(service.getMessages).toBeDefined();
    expect(typeof service.getMessages).toBe('function');
  });

  it('debería tener método markMessageRead', () => {
    expect(service.markMessageRead).toBeDefined();
    expect(typeof service.markMessageRead).toBe('function');
  });
});
