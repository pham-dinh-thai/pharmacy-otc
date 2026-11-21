import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateExpenseCommand } from '../../application/commands/create-expense/create-expense.command';
import { UpdateExpenseCommand } from '../../application/commands/update-expense/update-expense.command';
import { ApproveExpenseCommand } from '../../application/commands/approve-expense/approve-expense.command';
import { PayExpenseCommand } from '../../application/commands/pay-expense/pay-expense.command';
import { PaySupplierExpenseCommand } from '../../application/commands/pay-supplier-expense/pay-supplier-expense.command';
import { CancelExpenseCommand } from '../../application/commands/cancel-expense/cancel-expense.command';
import { GetExpensesQuery } from '../../application/queries/get-expenses/get-expenses.query';
import { ExpenseListPageReadModel } from '../../application/queries/get-expenses/expense-list-page.read-model';
import { GetExpenseQuery } from '../../application/queries/get-expense/get-expense.query';
import { ExpenseDetailReadModel } from '../../application/queries/get-expense/expense-detail.read-model';
import { CreateExpenseRequest } from './requests/create-expense.request';
import { UpdateExpenseRequest } from './requests/update-expense.request';
import { ListExpensesRequest } from './requests/list-expenses.request';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { RequirePermissions } from '../../../../shared/modules/security/require-permissions.decorator';
import { ActorContext } from '../../../../shared/modules/security/actor-context.decorator';
import { type ActorHeaders } from '../../../../shared/types/actor-headers';

@Controller('expenses')
@UseGuards(AuthGuard, PermissionsGuard)
export class ExpensesController {
  private readonly logger = new Logger(ExpensesController.name);

  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermissions(['expenses:read'])
  public findAll(
    @Query() request: ListExpensesRequest,
  ): Promise<ExpenseListPageReadModel> {
    return this.queryBus.execute(
      new GetExpensesQuery(
        request.search,
        request.status,
        request.category,
        request.supplierId,
        request.page,
        request.limit,
      ),
    );
  }

  @Get(':id')
  @RequirePermissions(['expenses:read'])
  public findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ExpenseDetailReadModel> {
    return this.queryBus.execute(new GetExpenseQuery(id));
  }

  @Post()
  @RequirePermissions(['expenses:create'])
  public async create(
    @Body() request: CreateExpenseRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const result = await this.commandBus.execute(
      new CreateExpenseCommand(
        request.name,
        request.category,
        request.amount,
        request.expenseDate,
        request.supplierId ?? null,
        request.paymentMethod ?? null,
        request.note ?? null,
        headers.actorId,
        headers,
      ),
    );

    this.logger.log('Expense created', result);

    return result;
  }

  @Patch(':id')
  @RequirePermissions(['expenses:update'])
  public update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() request: UpdateExpenseRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const result = this.commandBus.execute(
      new UpdateExpenseCommand(
        id,
        request.name,
        request.category,
        request.amount,
        request.expenseDate,
        request.supplierId ?? null,
        request.paymentMethod ?? null,
        request.note ?? null,
        headers,
      ),
    );

    this.logger.log(`Expense ${id} updated`);

    return result;
  }

  @Patch(':id/approve')
  @RequirePermissions(['expenses:approve'])
  public approve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const result = this.commandBus.execute(
      new ApproveExpenseCommand(id, headers),
    );

    this.logger.log(`Expense ${id} approved`);

    return result;
  }

  @Patch(':id/pay-supplier')
  @RequirePermissions(['expenses:pay'])
  public paySupplier(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const result = this.commandBus.execute(
      new PaySupplierExpenseCommand(id, headers),
    );

    this.logger.log(`Expense ${id} paid to supplier`);

    return result;
  }

  @Patch(':id/pay')
  @RequirePermissions(['expenses:pay'])
  public pay(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const result = this.commandBus.execute(new PayExpenseCommand(id, headers));

    this.logger.log(`Expense ${id} paid`);

    return result;
  }

  @Patch(':id/cancel')
  @RequirePermissions(['expenses:cancel'])
  public cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const result = this.commandBus.execute(
      new CancelExpenseCommand(id, headers),
    );

    this.logger.log(`Expense ${id} cancelled`);

    return result;
  }
}
