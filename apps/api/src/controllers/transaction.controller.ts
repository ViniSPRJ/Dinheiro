import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler.js';
import { Prisma, Transaction } from '@prisma/client';
import { receiptService } from '../services/receiptService.js';

const createTransactionSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']),
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  date: z.string().transform((str) => new Date(str)),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  transferFromId: z.string().optional(),
  transferToId: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'RECONCILED']).default('CONFIRMED'),
  notes: z.string().max(1000).optional(),
  tagIds: z.array(z.string()).optional(),
});

const updateTransactionSchema = createTransactionSchema.partial();

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']).optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'RECONCILED']).optional(),
});

type BalanceContext = Pick<Transaction, 'type' | 'accountId' | 'transferFromId' | 'transferToId'> & {
  // Accept a plain number (update path) or a Prisma Decimal (existing records);
  // both helpers coerce via Number(context.amount).
  amount: Prisma.Decimal | number;
};

const applyBalanceEffect = async (
  tx: Prisma.TransactionClient,
  context: BalanceContext
) => {
  const amount = Number(context.amount);

  if (context.type === 'EXPENSE' && context.accountId) {
    await tx.account.update({
      where: { id: context.accountId },
      data: { currentBalance: { decrement: amount } },
    });
  } else if (context.type === 'INCOME' && context.accountId) {
    await tx.account.update({
      where: { id: context.accountId },
      data: { currentBalance: { increment: amount } },
    });
  } else if (context.type === 'TRANSFER') {
    if (context.transferFromId) {
      await tx.account.update({
        where: { id: context.transferFromId },
        data: { currentBalance: { decrement: amount } },
      });
    }
    if (context.transferToId) {
      await tx.account.update({
        where: { id: context.transferToId },
        data: { currentBalance: { increment: amount } },
      });
    }
  }
};

const reverseBalanceEffect = async (
  tx: Prisma.TransactionClient,
  context: BalanceContext
) => {
  const amount = Number(context.amount);

  if (context.type === 'EXPENSE' && context.accountId) {
    await tx.account.update({
      where: { id: context.accountId },
      data: { currentBalance: { increment: amount } },
    });
  } else if (context.type === 'INCOME' && context.accountId) {
    await tx.account.update({
      where: { id: context.accountId },
      data: { currentBalance: { decrement: amount } },
    });
  } else if (context.type === 'TRANSFER') {
    if (context.transferFromId) {
      await tx.account.update({
        where: { id: context.transferFromId },
        data: { currentBalance: { increment: amount } },
      });
    }
    if (context.transferToId) {
      await tx.account.update({
        where: { id: context.transferToId },
        data: { currentBalance: { decrement: amount } },
      });
    }
  }
};

export class TransactionController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const query = querySchema.parse(req.query);

      const where: Prisma.TransactionWhereInput = {
        userId,
        deletedAt: null,
      };

      // Apply filters
      if (query.type) {
        where.type = query.type;
      }

      if (query.categoryId) {
        where.categoryId = query.categoryId;
      }

      if (query.accountId) {
        where.accountId = query.accountId;
      }

      if (query.status) {
        where.status = query.status;
      }

      if (query.startDate || query.endDate) {
        where.date = {};
        if (query.startDate) {
          where.date.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.date.lte = new Date(query.endDate);
        }
      }

      if (query.search) {
        where.OR = [
          { description: { contains: query.search, mode: 'insensitive' } },
          { notes: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, icon: true, color: true } },
            account: { select: { id: true, name: true, icon: true, color: true } },
            tags: { select: { id: true, name: true, color: true } },
          },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        prisma.transaction.count({ where }),
      ]);

      res.json({
        status: 'success',
        data: {
          transactions,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const data = createTransactionSchema.parse(req.body);

      // Validate transfer
      if (data.type === 'TRANSFER') {
        if (!data.transferFromId || !data.transferToId) {
          throw new BadRequestError('Transfer requires both source and destination accounts');
        }
        if (data.transferFromId === data.transferToId) {
          throw new BadRequestError('Source and destination accounts must be different');
        }
      }

      // Create transaction
      const transaction = await prisma.$transaction(async (tx) => {
        const created = await tx.transaction.create({
          data: {
            userId,
            type: data.type,
            amount: data.amount,
            description: data.description,
            date: data.date,
            categoryId: data.categoryId,
            accountId: data.accountId,
            transferFromId: data.transferFromId,
            transferToId: data.transferToId,
            status: data.status,
            notes: data.notes,
            tags: data.tagIds ? {
              connect: data.tagIds.map(id => ({ id })),
            } : undefined,
          },
          include: {
            category: { select: { id: true, name: true, icon: true, color: true } },
            account: { select: { id: true, name: true, icon: true, color: true } },
            tags: { select: { id: true, name: true, color: true } },
          },
        });

        // Update account balance
        if (data.type === 'EXPENSE' && data.accountId) {
          await tx.account.update({
            where: { id: data.accountId },
            data: { currentBalance: { decrement: data.amount } },
          });
        } else if (data.type === 'INCOME' && data.accountId) {
          await tx.account.update({
            where: { id: data.accountId },
            data: { currentBalance: { increment: data.amount } },
          });
        } else if (data.type === 'TRANSFER') {
          await tx.account.update({
            where: { id: data.transferFromId },
            data: { currentBalance: { decrement: data.amount } },
          });
          await tx.account.update({
            where: { id: data.transferToId },
            data: { currentBalance: { increment: data.amount } },
          });
        }

        return created;
      });

      res.status(201).json({
        status: 'success',
        data: { transaction },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const transaction = await prisma.transaction.findFirst({
        where: { id, userId, deletedAt: null },
        include: {
          category: true,
          account: true,
          tags: true,
          transferFrom: true,
          transferTo: true,
        },
      });

      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      res.json({
        status: 'success',
        data: { transaction },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const data = updateTransactionSchema.parse(req.body);

      // Get existing transaction
      const existing = await prisma.transaction.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError('Transaction not found');
      }

      const targetType = data.type ?? existing.type;
      const targetAmount = data.amount ?? Number(existing.amount);
      const targetAccountId = data.accountId ?? existing.accountId;
      const targetTransferFromId = data.transferFromId ?? existing.transferFromId;
      const targetTransferToId = data.transferToId ?? existing.transferToId;

      if (targetType === 'TRANSFER') {
        if (!targetTransferFromId || !targetTransferToId) {
          throw new BadRequestError('Transfer requires both source and destination accounts');
        }
        if (targetTransferFromId === targetTransferToId) {
          throw new BadRequestError('Source and destination accounts must be different');
        }
      }

      const transaction = await prisma.$transaction(async (tx) => {
        // Always reverse previous balance impact before applying updates
        await reverseBalanceEffect(tx, existing);

        // Update transaction
        const updated = await tx.transaction.update({
          where: { id },
          data: {
            description: data.description ?? existing.description,
            date: data.date ?? existing.date,
            categoryId: data.categoryId ?? existing.categoryId,
            status: data.status ?? existing.status,
            notes: data.notes ?? existing.notes,
            amount: targetAmount,
            type: targetType,
            accountId: targetType === 'TRANSFER' ? null : targetAccountId,
            transferFromId: targetType === 'TRANSFER' ? targetTransferFromId : null,
            transferToId: targetType === 'TRANSFER' ? targetTransferToId : null,
            tags: data.tagIds
              ? { set: data.tagIds.map((tagId) => ({ id: tagId })) }
              : undefined,
          },
          include: {
            category: { select: { id: true, name: true, icon: true, color: true } },
            account: { select: { id: true, name: true, icon: true, color: true } },
            tags: { select: { id: true, name: true, color: true } },
          },
        });

        // Re-apply balance impact with updated data
        await applyBalanceEffect(tx, {
          type: targetType,
          amount: targetAmount,
          accountId: targetAccountId,
          transferFromId: targetTransferFromId,
          transferToId: targetTransferToId,
        });

        return updated;
      });

      res.json({
        status: 'success',
        data: { transaction },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const existing = await prisma.transaction.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundError('Transaction not found');
      }

      await prisma.$transaction(async (tx) => {
        // Soft delete
        await tx.transaction.update({
          where: { id },
          data: { deletedAt: new Date() },
        });

        // Reverse balance changes
        if (existing.type === 'EXPENSE' && existing.accountId) {
          await tx.account.update({
            where: { id: existing.accountId },
            data: { currentBalance: { increment: Number(existing.amount) } },
          });
        } else if (existing.type === 'INCOME' && existing.accountId) {
          await tx.account.update({
            where: { id: existing.accountId },
            data: { currentBalance: { decrement: Number(existing.amount) } },
          });
        } else if (existing.type === 'TRANSFER') {
          if (existing.transferFromId) {
            await tx.account.update({
              where: { id: existing.transferFromId },
              data: { currentBalance: { increment: Number(existing.amount) } },
            });
          }
          if (existing.transferToId) {
            await tx.account.update({
              where: { id: existing.transferToId },
              data: { currentBalance: { decrement: Number(existing.amount) } },
            });
          }
        }
      });

      res.json({
        status: 'success',
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        throw new BadRequestError('Search query is required');
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          deletedAt: null,
          OR: [
            { description: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          account: { select: { id: true, name: true, icon: true, color: true } },
        },
        orderBy: { date: 'desc' },
        take: 50,
      });

      res.json({
        status: 'success',
        data: { transactions },
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { ids } = z.object({ ids: z.array(z.string()) }).parse(req.body);

      const transactions = await prisma.transaction.findMany({
        where: {
          id: { in: ids },
          userId,
          deletedAt: null,
        },
        select: {
          id: true,
          type: true,
          amount: true,
          accountId: true,
          transferFromId: true,
          transferToId: true,
        },
      });

      const deletedAt = new Date();

      await prisma.$transaction(async (tx) => {
        for (const txToDelete of transactions) {
          await tx.transaction.update({
            where: { id: txToDelete.id },
            data: { deletedAt },
          });
          await reverseBalanceEffect(tx, txToDelete);
        }
      });

      res.json({
        status: 'success',
        message: `${transactions.length} transactions deleted`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async import(req: Request, res: Response) {
    // TODO: Implement CSV/OFX import
    res.status(501).json({
      status: 'error',
      message: 'Import not yet implemented',
    });
  }

  static async extractReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const file = req.file;
      if (!file) {
        throw new BadRequestError('No file uploaded');
      }

      const extraction = await receiptService.extractFromReceipt(
        userId,
        file.buffer,
        file.mimetype,
        file.originalname
      );

      if (!extraction) {
        res.json({
          status: 'success',
          data: { available: false, message: 'Servico de OCR indisponivel no momento.' },
        });
        return;
      }

      res.json({ status: 'success', data: { available: true, ...extraction } });
    } catch (error) {
      next(error);
    }
  }
}
