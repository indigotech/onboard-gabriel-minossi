import { HttpError } from '@src/error';
import { Entity, FindConditions, Repository, DeepPartial } from 'typeorm';

export class DataSource<Entity> {
  constructor(protected readonly dbRepository: Repository<Entity>) {}

  async findOne(conditions: FindConditions<Entity>): Promise<Entity> {
    const entity: Entity = await this.dbRepository.findOne({ where: conditions });

    if (!entity) {
      throw new HttpError(404, `${Entity.constructor.name} not found`);
    }

    return entity;
  }

  async insert(input: DeepPartial<Entity>): Promise<Entity> {
    return this.dbRepository.save(input);
  }
}
