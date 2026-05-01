import { ConflictException } from '@nestjs/common';
import { BootstrapService } from './bootstrap.service';
import { DatabaseService } from '../database';

describe('BootstrapService', () => {
  let service: BootstrapService;
  let db: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    db = {
      query: jest.fn(),
    } as unknown as jest.Mocked<DatabaseService>;

    service = new BootstrapService(db);
  });

  const authUser = { authUserId: 'auth-1', email: 'test@company.com' };

  it('should create a new user and org on first bootstrap', async () => {
    // No existing user
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // Insert user
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'user-1' }],
      rowCount: 1,
    } as any);
    // No existing memberships
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // No domain match
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // No slug conflict
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // Insert org
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'org-1' }],
      rowCount: 1,
    } as any);
    // Insert membership
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const result = await service.bootstrap(authUser, {
      orgName: 'My Company',
      orgSlug: 'my-company',
    });

    expect(result.isNewUser).toBe(true);
    expect(result.isNewOrg).toBe(true);
    expect(result.userId).toBe('user-1');
    expect(result.orgId).toBe('org-1');
    expect(result.role).toBe('owner');
  });

  it('should return existing user if already bootstrapped', async () => {
    // Existing user
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'user-1' }],
      rowCount: 1,
    } as any);
    // Existing membership
    db.query.mockResolvedValueOnce({
      rows: [{ org_id: 'org-1', slug: 'test-co', role: 'member' }],
      rowCount: 1,
    } as any);

    const result = await service.bootstrap(authUser, {});

    expect(result.isNewUser).toBe(false);
    expect(result.isNewOrg).toBe(false);
    expect(result.orgId).toBe('org-1');
  });

  it('should throw on slug conflict', async () => {
    // No existing user
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // Insert user
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'user-1' }],
      rowCount: 1,
    } as any);
    // No existing memberships
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // No domain match
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // Slug conflict
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'other' }],
      rowCount: 1,
    } as any);

    await expect(
      service.bootstrap(authUser, {
        orgName: 'Conflict',
        orgSlug: 'taken-slug',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
