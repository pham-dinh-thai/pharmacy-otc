import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CATEGORIES_REPOSITORY,
  type ICategoriesRepository,
} from '../../../domain/categories.repository';
import { CategoryNotFoundException } from '../../../domain/exceptions/category.exceptions';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { CATEGORY_RESTORED_EVENT } from '../../../domain/events/category-restored.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { RestoreCategoryCommand } from './restore-category.command';

@CommandHandler(RestoreCategoryCommand)
export class RestoreCategoryHandler implements ICommandHandler<RestoreCategoryCommand> {
  public constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categoriesRepository: ICategoriesRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

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

      await this.outboxRepository.create({
        eventType: CATEGORY_RESTORED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.CATEGORIES,
          entityId: category.getId(),
          before: { deletedAt: previousDeletedAt },
          after: { deletedAt: null },
        }),
      });

      return { id: category.getId() };
    });
  }
}
