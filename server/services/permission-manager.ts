/**
 * Permission Manager - Basic permission management
 * Handles user permissions and access control
 */

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface UserPermission {
  userId: number;
  permissionId: string;
  grantedAt: Date;
  grantedBy: number;
}

export class PermissionManager {
  private static instance: PermissionManager;
  private permissions: Map<string, Permission> = new Map();
  private userPermissions: Map<number, Set<string>> = new Map();

  private constructor() {
    this.initializeDefaultPermissions();
  }

  static getInstance(): PermissionManager {
    if (!this.instance) {
      this.instance = new PermissionManager();
    }
    return this.instance;
  }

  private initializeDefaultPermissions() {
    const defaultPermissions: Permission[] = [
      {
        id: 'accounts.read',
        name: 'Read Accounts',
        description: 'View Telegram accounts',
        resource: 'accounts',
        action: 'read'
      },
      {
        id: 'accounts.write',
        name: 'Manage Accounts',
        description: 'Add, edit, delete Telegram accounts',
        resource: 'accounts',
        action: 'write'
      },
      {
        id: 'extraction.read',
        name: 'Read Extraction',
        description: 'View extraction results',
        resource: 'extraction',
        action: 'read'
      },
      {
        id: 'extraction.write',
        name: 'Perform Extraction',
        description: 'Execute member extraction',
        resource: 'extraction',
        action: 'write'
      },
      {
        id: 'bulk_operations.read',
        name: 'Read Bulk Operations',
        description: 'View bulk operation history',
        resource: 'bulk_operations',
        action: 'read'
      },
      {
        id: 'bulk_operations.write',
        name: 'Execute Bulk Operations',
        description: 'Perform bulk operations',
        resource: 'bulk_operations',
        action: 'write'
      },
      {
        id: 'admin.system',
        name: 'System Administration',
        description: 'Full system access',
        resource: 'system',
        action: 'admin'
      }
    ];

    defaultPermissions.forEach(perm => {
      this.permissions.set(perm.id, perm);
    });
  }

  /**
   * Check if user has permission
   */
  hasPermission(userId: number, permissionId: string): boolean {
    const userPerms = this.userPermissions.get(userId);
    return userPerms ? userPerms.has(permissionId) : false;
  }

  /**
   * Grant permission to user
   */
  grantPermission(userId: number, permissionId: string, grantedBy: number): boolean {
    if (!this.permissions.has(permissionId)) {
      return false;
    }

    const userPerms = this.userPermissions.get(userId) || new Set();
    userPerms.add(permissionId);
    this.userPermissions.set(userId, userPerms);

    return true;
  }

  /**
   * Revoke permission from user
   */
  revokePermission(userId: number, permissionId: string): boolean {
    const userPerms = this.userPermissions.get(userId);
    if (!userPerms) {
      return false;
    }

    const removed = userPerms.delete(permissionId);
    if (userPerms.size === 0) {
      this.userPermissions.delete(userId);
    }

    return removed;
  }

  /**
   * Get all permissions for user
   */
  getUserPermissions(userId: number): Permission[] {
    const userPerms = this.userPermissions.get(userId);
    if (!userPerms) {
      return [];
    }

    return Array.from(userPerms)
      .map(permId => this.permissions.get(permId))
      .filter(Boolean) as Permission[];
  }

  /**
   * Get all available permissions
   */
  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  /**
   * Check resource access
   */
  canAccess(userId: number, resource: string, action: string): boolean {
    const userPerms = this.getUserPermissions(userId);
    return userPerms.some(perm => 
      perm.resource === resource && 
      (perm.action === action || perm.action === 'admin')
    );
  }
}

export const permissionManager = PermissionManager.getInstance();
