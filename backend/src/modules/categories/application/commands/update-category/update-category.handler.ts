import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CATEGORIES_REPOSITORY,
  type ICategoriesRepository,
} from '../../../domain/categories.repository';
import {
  CategoryAlreadyExistsException,
  CategoryNotFoundException,
} from '../../../domain/exceptions/category.exceptions';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { CATEGORY_UPDATED_EVENT } from '../../../domain/events/category-updated.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { UpdateCategoryCommand } from './update-category.command';

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand> {
  public constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categoriesRepository: ICategoriesRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(
    command: UpdateCategoryCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const category = await this.categoriesRepository.findById(command.id);

      if (!category) throw new CategoryNotFoundException(command.id);

      const before = {
        name: category.getName(),
        slug: category.getSlug(),
        description: category.getDescription(),
      };

      category.update({
        name: command.name,
        slug: command.slug,
        description: command.description,
      });

      if (
        await this.categoriesRepository.existsByNameOrSlug(
          category.getName(),
          category.getSlug(),
          category.getId(),
        )
      ) {
        throw new CategoryAlreadyExistsException(category.getName());
      }

      await this.categoriesRepository.update(category);

      await this.outboxRepository.create({
        eventType: CATEGORY_UPDATED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.CATEGORIES,
          entityId: category.getId(),
          before,
          after: {
            name: category.getName(),
            slug: category.getSlug(),
            description: category.getDescription(),
          },
        }),
      });

      return { id: category.getId() };
    });
  }
}
