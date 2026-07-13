import { prisma } from '../../config';
import { comparePassword, signAccessToken, signRefreshToken, verifyRefreshToken, TokenPayload } from '../../utils';
import { AppError } from '../../middleware';
import bcrypt from 'bcryptjs';

export class AuthService {
  /**
   * Authenticate user with email and password.
   * Returns access token, refresh token, and user info.
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            avatar: true,
            departmentId: true,
            designationId: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === 'LOCKED') {
      throw new AppError('Account is locked. Contact HR administrator.', 403, 'ACCOUNT_LOCKED');
    }

    if (user.status === 'INACTIVE') {
      throw new AppError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Build permissions array
    const permissions = user.role.rolePermissions.map((rp) => {
      const p = rp.permission;
      return p.scope ? `${p.resource}:${p.action}:${p.scope}` : `${p.resource}:${p.action}`;
    });

    const tokenPayload: TokenPayload = {
      userId: user.id,
      employeeId: user.employee?.id || '',
      roleId: user.role.id,
      roleName: user.role.name,
      permissions,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ userId: user.id });

    // Store hashed refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshTokenHash, lastLogin: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        permissions,
        employee: user.employee
          ? {
              id: user.employee.id,
              firstName: user.employee.firstName,
              lastName: user.employee.lastName,
              name: `${user.employee.firstName} ${user.employee.lastName}`,
              employeeCode: user.employee.employeeCode,
              avatar: user.employee.avatar,
              department: user.employee.department.name,
              designation: user.employee.designation.name,
            }
          : null,
      },
    };
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refreshToken(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!user || !user.refreshToken) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Verify the stored refresh token matches
    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Build permissions
    const permissions = user.role.rolePermissions.map((rp) => {
      const p = rp.permission;
      return p.scope ? `${p.resource}:${p.action}:${p.scope}` : `${p.resource}:${p.action}`;
    });

    const tokenPayload: TokenPayload = {
      userId: user.id,
      employeeId: user.employee?.id || '',
      roleId: user.role.id,
      roleName: user.role.name,
      permissions,
    };

    // Rotate refresh token
    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken({ userId: user.id });
    const newRefreshHash = await bcrypt.hash(newRefreshToken, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshHash },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout: invalidate refresh token.
   */
  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Get current user data from token.
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        employee: {
          include: {
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
            manager: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const permissions = user.role.rolePermissions.map((rp) => {
      const p = rp.permission;
      return p.scope ? `${p.resource}:${p.action}:${p.scope}` : `${p.resource}:${p.action}`;
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.role.id,
      permissions,
      employee: user.employee
        ? {
            id: user.employee.id,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            name: `${user.employee.firstName} ${user.employee.lastName}`,
            employeeCode: user.employee.employeeCode,
            avatar: user.employee.avatar,
            phone: user.employee.phone,
            email: user.employee.email,
            department: user.employee.department,
            designation: user.employee.designation,
            manager: user.employee.manager
              ? {
                  id: user.employee.manager.id,
                  name: `${user.employee.manager.firstName} ${user.employee.manager.lastName}`,
                }
              : null,
            dateOfJoining: user.employee.dateOfJoining,
          }
        : null,
    };
  }
}

export const authService = new AuthService();
