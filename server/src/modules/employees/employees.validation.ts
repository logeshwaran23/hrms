import { z } from 'zod';

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  dateOfJoining: z.string().min(1, 'Date of joining is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  departmentId: z.string().min(1, 'Department is required'),
  designationId: z.string().min(1, 'Designation is required'),
  managerId: z.string().optional().nullable(),
  roleId: z.string().min(1, 'Role is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  managerId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_NOTICE', 'TERMINATED']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  ifscCode: z.string().optional(),
  panNumber: z.string().optional(),
  aadharNumber: z.string().optional(),
  maritalStatus: z.string().optional(),
  bloodGroup: z.string().optional(),
});

export const updateProfileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  ifscCode: z.string().optional(),
  maritalStatus: z.string().optional(),
  bloodGroup: z.string().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
