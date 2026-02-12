/**
 * Generic repository contract
 */
export interface Repository<T, ID = string> {
  save(entity: T): Promise<void>;
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  delete(id: ID): Promise<void>;
  exists(id: ID): Promise<boolean>;
}
