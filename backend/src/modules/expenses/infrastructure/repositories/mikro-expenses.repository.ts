import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EntityManager,
  FilterQuery,
  ForeignKeyConstraintViolationException,
  LockMode,
} from '@mikro-orm/core';
import {
  ExpensePage,
  FindExpenseOptions,
  FindExpensesFilters,
  IExpensesRepository,
} from '../../domain/expenses.repository';
import { Expense } from '../../domain/expense.aggregate';
import { MikroExpense } from '../entities/mikro-expense.entity';
import { ExpenseMapper } from '../mappers/expense.mapper';
import { likePattern } from '../../../../shared/utils/list-filters';

@Injectable()
export class MikroExpensesRepository implements IExpensesRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findAll(): Promise<Expense[]> {
    const mikroExpenses = await this.entityManager.findAll(MikroExpense, {
      orderBy: { expenseDate: 'desc', createdAt: 'desc' },
    });

    return mikroExpenses.map((mikroExpense) =>
      ExpenseMapper.toDomain(mikroExpense),
    );
  }

  public async findPage(
    filters: FindExpensesFilters = {},
  ): Promise<ExpensePage> {
    const pattern = likePattern(filters.search);

    const where: FilterQuery<MikroExpense> = {
      ...(filters.status && filters.status !== 'all'
        ? { status: filters.status }
        : {}),
      ...(filters.category && filters.category !== 'all'
        ? { category: filters.category }
        : {}),
      ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
      ...(pattern
        ? {
            $or: [{ name: { $ilike: pattern } }, { note: { $ilike: pattern } }],
          }
        : {}),
    };

    const [rows, total] = await this.entityManager.findAndCount(
      MikroExpense,
      where,
      {
        orderBy: { createdAt: 'desc', id: 'desc' },
        ...(filters.limit !== undefined ? { limit: filters.limit } : {}),
        ...(filters.offset !== undefined ? { offset: filters.offset } : {}),
      },
    );

    return {
      items: rows.map((row) => ExpenseMapper.toDomain(row)),
      total,
    };
  }

  public async findById(
    id: string,
    options: FindExpenseOptions = {},
  ): Promise<Expense | null> {
    const mikroExpense = await this.entityManager.findOne(
      MikroExpense,
      { id },
      { lockMode: options.forUpdate ? LockMode.PESSIMISTIC_WRITE : undefined },
    );

    return mikroExpense ? ExpenseMapper.toDomain(mikroExpense) : null;
  }

  public create(expense: Expense): Promise<Expense> {
    return this.persistExpense(new MikroExpense(), expense, true);
  }

  public update(expense: Expense): Promise<Expense> {
    const mikroExpense = this.entityManager.getReference(
      MikroExpense,
      expense.getId(),
    );

    return this.persistExpense(mikroExpense, expense, false);
  }

  private async persistExpense(
    mikroExpense: MikroExpense,
    expense: Expense,
    insert: boolean,
  ): Promise<Expense> {
    try {
      ExpenseMapper.assign(mikroExpense, expense);

      if (insert) {
        this.entityManager.persist(mikroExpense);
      }

      await this.entityManager.flush();

      return ExpenseMapper.toDomain(mikroExpense);
    } catch (e) {
      if (e instanceof ForeignKeyConstraintViolationException) {
        throw new NotFoundException('Supplier not found');
      }

      throw e;
    }
  }
}
