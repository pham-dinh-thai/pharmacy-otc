import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CATEGORIES_REPOSITORY,
  type ICategoriesRepository,
} from '../../../domain/categories.repository';
import { Category } from '../../../domain/category.aggregate';
import { CategoryAlreadyExistsException } from '../../../domain/exceptions/category.exceptions';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { CATEGORY_CREATED_EVENT } from '../../../domain/events/category-created.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { CreateCategoryCommand } from './create-category.command';

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand> {
  public constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categoriesRepository: ICategoriesRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(
    command: CreateCategoryCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const category = Category.create({
        name: command.name,
        slug: command.slug,
        description: command.description,
      });

      if (
        await this.categoriesRepository.existsByNameOrSlug(
          category.getName(),
          category.getSlug(),
        )
      ) {
        throw new CategoryAlreadyExistsException(category.getName());
      }

      await this.categoriesRepository.create(category);

      await this.outboxRepository.create({
        eventType: CATEGORY_CREATED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.CATEGORIES,
          entityId: category.getId(),
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
