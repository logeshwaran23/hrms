import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number, code: string = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Log with timestamp for Render logs
  console.error(`[${new Date().toISOString()}] Error:`, err.message || err);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      const target = prismaErr.meta?.target;
      res.status(409).json({
        success: false,
        message: `A record with this ${target?.[0] || 'value'} already exists`,
        code: 'DUPLICATE_ENTRY',
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Record not found',
        code: 'NOT_FOUND',
      });
      return;
    }
  }

  // Prisma connection / pool exhaustion errors
  if (
    err.constructor.name === 'PrismaClientInitializationError' ||
    err.constructor.name === 'PrismaClientRustPanicError' ||
    (err as any).code === 'P1001' || (err as any).code === 'P1002' || (err as any).code === 'P1017'
  ) {
    console.error('[DB CONNECTION ERROR]', err.message);
    res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please try again in a moment.',
      code: 'DB_UNAVAILABLE',
    });
    return;
  }

  // Prisma validation error
  if (err.constructor.name === 'PrismaClientValidationError') {
    res.status(400).json({
      success: false,
      message: 'Invalid request data',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      success: false,
      message: 'Cross-origin request blocked',
      code: 'CORS_ERROR',
    });
    return;
  }

  // Fallback
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
