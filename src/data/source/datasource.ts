import { HttpError } from '@src/error';
import { DeepPartial, FindConditions, FindManyOptions, Repository } from 'typeorm';

export class DataSource<Entity> {
  constructor(protected readonly dbRepository: Repository<Entity>) {}

  async findOne(conditions: FindConditions<Entity>): Promise<Entity> {
    const entity: Entity = await this.dbRepository.findOne({ where: conditions });

    if (!entity) {
      throw new HttpError(404, `${this.dbRepository.metadata.name} not found`);
    }

    return entity;
  }

  async findMany(options: FindManyOptions<Entity>): Promise<[Entity[], number]> {
    const entities: [Entity[], number] = await this.dbRepository.findAndCount(options);

    if (!entities.length) {
      throw new HttpError(404, `${this.dbRepository.metadata.name} not found`);
    }

    return entities;
  }

  async insert(input: DeepPartial<Entity>): Promise<Entity> {
    return this.dbRepository.save(input);
  }
}
