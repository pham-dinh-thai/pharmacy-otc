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
import { RestoreCategoryCommand } from './restore-category.command';

@CommandHandler(RestoreCategoryCommand)
export class RestoreCategoryHandler implements ICommandHandler<RestoreCategoryCommand> {
  public constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categoriesRepository: ICategoriesRepository,

    private readonly commandBus: CommandBus,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(
    command: RestoreCategoryCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const category = await this.categoriesRepository.findByIdIncludingDeleted(
        command.id,
      );

      if (!category) throw new CategoryNotFoundException(command.id);

      const previousDeletedAt = category.getDeletedAt();

      category.restore();

      await this.categoriesRepository.update(category);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'restore',
            entityType: EntityType.CATEGORIES,
            entityId: category.getId(),
            before: { deletedAt: previousDeletedAt },
            after: { deletedAt: null },
          }),
        ),
      );

      return { id: category.getId() };
    });
  }
}
