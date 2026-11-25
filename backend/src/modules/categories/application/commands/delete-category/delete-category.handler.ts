import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CATEGORIES_REPOSITORY,
  type ICategoriesRepository,
} from '../../../domain/categories.repository';
import { CategoryNotFoundException } from '../../../domain/exceptions/category.exceptions';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { DeleteCategoryCommand } from './delete-category.command';

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand> {
  public constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categoriesRepository: ICategoriesRepository,

    private readonly commandBus: CommandBus,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(
    command: DeleteCategoryCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const category = await this.categoriesRepository.findByIdIncludingDeleted(
        command.id,
      );

      if (!category) throw new CategoryNotFoundException(command.id);

      category.softDelete();

      await this.categoriesRepository.update(category);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'delete',
            entityType: EntityType.CATEGORIES,
            entityId: category.getId(),
            before: { deletedAt: null },
            after: { deletedAt: category.getDeletedAt() },
          }),
        ),
      );

      return { id: category.getId() };
    });
  }
}
