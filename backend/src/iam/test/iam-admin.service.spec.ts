import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import { IamAdminService } from '../services/iam-admin.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('IamAdminService', () => {
  let service: IamAdminService;
  let supabase: any;

  // Reusable mock chain builder for Supabase fluent API
  function mockChain(overrides: Record<string, any> = {}) {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      ...overrides,
    };
    return chain;
  }

  beforeEach(async () => {
    supabase = {
      from: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IamAdminService,
        {
          provide: SupabaseClient,
          useValue: supabase,
        },
      ],
    }).compile();

    service = module.get<IamAdminService>(IamAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Roles ---

  describe('listRoles', () => {
    it('should return mapped roles', async () => {
      const chain = mockChain();
      chain.order.mockResolvedValue({
        data: [
          { id: 'r1', urn: 'role:admin', description: 'Admin', created_at: '2026-01-01', updated_at: null },
        ],
        error: null,
      });
      supabase.from.mockReturnValue(chain);

      const result = await service.listRoles();

      expect(supabase.from).toHaveBeenCalledWith('iam_roles');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('r1');
      expect(result[0].urn).toBe('role:admin');
    });

    it('should throw BadRequestException on error', async () => {
      const chain = mockChain();
      chain.order.mockResolvedValue({ data: null, error: { message: 'DB error' } });
      supabase.from.mockReturnValue(chain);

      await expect(service.listRoles()).rejects.toThrow(BadRequestException);
    });
  });

  describe('createRole', () => {
    it('should create and return a role', async () => {
      const chain = mockChain();
      chain.single.mockResolvedValue({
        data: { id: 'r1', urn: 'role:new', description: 'Desc', created_at: '2026-01-01', updated_at: null },
        error: null,
      });
      supabase.from.mockReturnValue(chain);

      const result = await service.createRole({ urn: 'role:new', description: 'Desc' });

      expect(result.urn).toBe('role:new');
      expect(result.description).toBe('Desc');
    });

    it('should throw BadRequestException on error', async () => {
      const chain = mockChain();
      chain.single.mockResolvedValue({ data: null, error: { message: 'Duplicate' } });
      supabase.from.mockReturnValue(chain);

      await expect(service.createRole({ urn: 'role:dup' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateRole', () => {
    it('should update and return a role', async () => {
      const chain = mockChain();
      chain.single.mockResolvedValue({
        data: { id: 'r1', urn: 'role:updated', description: 'New desc', created_at: '2026-01-01', updated_at: '2026-01-02' },
        error: null,
      });
      supabase.from.mockReturnValue(chain);

      const result = await service.updateRole('r1', { urn: 'role:updated', description: 'New desc' });

      expect(result.urn).toBe('role:updated');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException on supabase error', async () => {
      const chain = mockChain();
      chain.single.mockResolvedValue({ data: null, error: { message: 'Update failed' } });
      supabase.from.mockReturnValue(chain);

      await expect(service.updateRole('r1', { urn: 'role:x' })).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when role not found (data is null, no error)', async () => {
      const chain = mockChain();
      chain.single.mockResolvedValue({ data: null, error: null });
      supabase.from.mockReturnValue(chain);

      await expect(service.updateRole('missing', {})).rejects.toThrow(NotFoundException);
    });

    it('should handle partial updates with only description', async () => {
      const chain = mockChain();
      chain.single.mockResolvedValue({
        data: { id: 'r1', urn: 'role:existing', description: 'Updated', created_at: '2026-01-01', updated_at: null },
        error: null,
      });
      supabase.from.mockReturnValue(chain);

      const result = await service.updateRole('r1', { description: 'Updated' });

      expect(result.description).toBe('Updated');
    });
  });

  describe('deleteRole', () => {
    it('should delete a role without error', async () => {
      const chain = mockChain();
      chain.eq.mockResolvedValue({ error: null });
      supabase.from.mockReturnValue(chain);

      await expect(service.deleteRole('r1')).resolves.toBeUndefined();
      expect(supabase.from).toHaveBeenCalledWith('iam_roles');
    });

    it('should throw BadRequestException on error', async () => {
      const chain = mockChain();
      chain.eq.mockResolvedValue({ error: { message: 'Delete failed' } });
      supabase.from.mockReturnValue(chain);

      await expect(service.deleteRole('r1')).rejects.toThrow(BadRequestException);
    });
  });

  // --- Permissions ---

  describe('listPermissions', () => {
    it('should return mapped permissions', async () => {
      const chain = mockChain();
      chain.order.mockResolvedValue({
        data: [
          { id: 'p1', urn: 'action:read', description: 'Read', created_at: '2026-01-01', updated_at: null },
        ],
        error: null,
      });
      supabase.from.mockReturnValue(chain);

      const result = await service.listPermissions();

      expect(supabase.from).toHaveBeenCalledWith('iam_permissions');
      expect(result).toHaveLength(1);
      expect(result[0].urn).toBe('action:read');
    });

    it('should throw BadRequestException on error', async () => {
      const chain = mockChain();
      chain.order.mockResolvedValue({ data: null, error: { message: 'DB error' } });
      supabase.from.mockReturnValue(chain);

      await expect(service.listPermissions()).rejects.toThrow(BadRequestException);
    });
  });

  describe('createPermission', () => {
    it('should create and return a permission', async () => {
      const chain = mockChain();
      chain.single.mockResolvedValue({
        data: { id: 'p1', urn: 'action:write', description: 'Write', created_at: '2026-01-01', updated_at: null },
        error: null,
      });
      supabase.from.mockReturnValue(chain);

      const result = await service.createPermission({ urn: 'action:write', description: 'Write' });

      expect(result.urn).toBe('action:write');
    });

    it('should throw BadRequestException on error', async () => {
      const chain = mockChain();
      chain.single.mockResolvedValue({ data: null, error: { message: 'Duplicate' } });
      supabase.from.mockReturnValue(chain);

      await expect(service.createPermission({ urn: 'action:dup' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePermission', () => {
    it('should update and return a permission', async () => {
      const chain = mockChain();
      chain.single.mockResolvedValue({
        data: { id: 'p1', urn: 'action:updated', description: 'New', created_at: '2026-01-01', updated_at: '2026-01-02' },
        error: null,
      });
      supabase.from.mockReturnValue(chain);

      const result = await service.updatePermission('p1', { urn: 'action:updated', description: 'New' });

      expect(result.urn).toBe('action:updated');
    });

    it('should throw BadRequestException on supabase error', async () => {
      const chain = mockChain();
      chain.single.mockResolvedValue({ data: null, error: { message: 'Fail' } });
      supabase.from.mockReturnValue(chain);

      await expect(service.updatePermission('p1', { urn: 'action:x' })).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when permission not found', async () => {
      const chain = mockChain();
      chain.single.mockResolvedValue({ data: null, error: null });
      supabase.from.mockReturnValue(chain);

      await expect(service.updatePermission('missing', {})).rejects.toThrow(NotFoundException);
    });

    it('should handle partial updates with only description', async () => {
      const chain = mockChain();
      chain.single.mockResolvedValue({
        data: { id: 'p1', urn: 'action:existing', description: 'Desc only', created_at: '2026-01-01', updated_at: null },
        error: null,
      });
      supabase.from.mockReturnValue(chain);

      const result = await service.updatePermission('p1', { description: 'Desc only' });

      expect(result.description).toBe('Desc only');
    });
  });

  describe('deletePermission', () => {
    it('should delete a permission without error', async () => {
      const chain = mockChain();
      chain.eq.mockResolvedValue({ error: null });
      supabase.from.mockReturnValue(chain);

      await expect(service.deletePermission('p1')).resolves.toBeUndefined();
      expect(supabase.from).toHaveBeenCalledWith('iam_permissions');
    });

    it('should throw BadRequestException on error', async () => {
      const chain = mockChain();
      chain.eq.mockResolvedValue({ error: { message: 'Delete failed' } });
      supabase.from.mockReturnValue(chain);

      await expect(service.deletePermission('p1')).rejects.toThrow(BadRequestException);
    });
  });

  // --- Role Permissions ---

  describe('getRolePermissions', () => {
    it('should return permission IDs for a role', async () => {
      const chain = mockChain();
      chain.eq.mockResolvedValue({
        data: [{ permission_id: 'p1' }, { permission_id: 'p2' }],
        error: null,
      });
      supabase.from.mockReturnValue(chain);

      const result = await service.getRolePermissions('r1');

      expect(result).toEqual(['p1', 'p2']);
      expect(supabase.from).toHaveBeenCalledWith('iam_role_permissions');
    });

    it('should throw BadRequestException on error', async () => {
      const chain = mockChain();
      chain.eq.mockResolvedValue({ data: null, error: { message: 'DB error' } });
      supabase.from.mockReturnValue(chain);

      await expect(service.getRolePermissions('r1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateRolePermissions', () => {
    it('should clear and insert new permissions', async () => {
      // 1st call: role existence check
      const countChain = mockChain();
      countChain.eq.mockResolvedValue({ count: 1 });

      // 2nd call: delete existing role_permissions
      const deleteChain = mockChain();
      deleteChain.eq.mockResolvedValue({ error: null });

      // 3rd call: insert new role_permissions
      const insertChain = mockChain();
      insertChain.insert.mockResolvedValue({ error: null });

      supabase.from
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(deleteChain)
        .mockReturnValueOnce(insertChain);

      await expect(service.updateRolePermissions('r1', ['p1', 'p2'])).resolves.toBeUndefined();
      expect(supabase.from).toHaveBeenCalledTimes(3);
    });

    it('should skip insert when permissionIds is empty', async () => {
      const countChain = mockChain();
      countChain.eq.mockResolvedValue({ count: 1 });

      const deleteChain = mockChain();
      deleteChain.eq.mockResolvedValue({ error: null });

      supabase.from
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(deleteChain);

      await expect(service.updateRolePermissions('r1', [])).resolves.toBeUndefined();
      // Only 2 calls: count check + delete, no insert
      expect(supabase.from).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const countChain = mockChain();
      countChain.eq.mockResolvedValue({ count: 0 });

      supabase.from.mockReturnValueOnce(countChain);

      await expect(service.updateRolePermissions('missing', ['p1'])).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when delete fails', async () => {
      const countChain = mockChain();
      countChain.eq.mockResolvedValue({ count: 1 });

      const deleteChain = mockChain();
      deleteChain.eq.mockResolvedValue({ error: { message: 'Delete failed' } });

      supabase.from
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(deleteChain);

      await expect(service.updateRolePermissions('r1', ['p1'])).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when insert fails', async () => {
      const countChain = mockChain();
      countChain.eq.mockResolvedValue({ count: 1 });

      const deleteChain = mockChain();
      deleteChain.eq.mockResolvedValue({ error: null });

      const insertChain = mockChain();
      insertChain.insert.mockResolvedValue({ error: { message: 'Insert failed' } });

      supabase.from
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(deleteChain)
        .mockReturnValueOnce(insertChain);

      await expect(service.updateRolePermissions('r1', ['p1'])).rejects.toThrow(BadRequestException);
    });
  });

  // --- Mappers ---

  describe('mappers', () => {
    it('should handle null timestamps in role mapping', async () => {
      const chain = mockChain();
      chain.order.mockResolvedValue({
        data: [{ id: 'r1', urn: 'role:test', description: null, created_at: null, updated_at: null }],
        error: null,
      });
      supabase.from.mockReturnValue(chain);

      const result = await service.listRoles();

      expect(result[0].createdAt).toBeUndefined();
      expect(result[0].updatedAt).toBeUndefined();
    });

    it('should handle null timestamps in permission mapping', async () => {
      const chain = mockChain();
      chain.order.mockResolvedValue({
        data: [{ id: 'p1', urn: 'action:test', description: null, created_at: null, updated_at: null }],
        error: null,
      });
      supabase.from.mockReturnValue(chain);

      const result = await service.listPermissions();

      expect(result[0].createdAt).toBeUndefined();
      expect(result[0].updatedAt).toBeUndefined();
    });
  });
});
