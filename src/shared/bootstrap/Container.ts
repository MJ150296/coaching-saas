/**
 * Dependency Injection Container
 * Singleton pattern for managing application dependencies
 */

export class Container {
  private static instance: Container;
  private static readonly dependencies: Map<string, unknown> = new Map();

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Register a dependency
   */
  static register<T>(key: string, dependency: T): void {
    Container.dependencies.set(key, dependency);
  }

  /**
   * Register a singleton factory
   */
  static registerSingleton<T>(key: string, factory: () => T): void {
    let instance: T | null = null;
    Container.dependencies.set(key, () => {
      if (!instance) {
        instance = factory();
      }
      return instance;
    });
  }

  /**
   * Register a factory (creates new instance each time)
   */
  static registerFactory<T>(key: string, factory: () => T): void {
    Container.dependencies.set(key, factory);
  }

  /**
   * Resolve a dependency
   */
  static resolve<T = unknown>(key: string): T {
    const dep = Container.dependencies.get(key);

    if (dep === undefined) {
      throw new Error(`Dependency not found: ${key}`);
    }

    if (typeof dep === 'function') {
      return (dep as () => T)();
    }
    return dep as T;
  }

  /**
   * Check if dependency exists
   */
  static has(key: string): boolean {
    return Container.dependencies.has(key);
  }

  /**
   * Clear all dependencies
   */
  static clear(): void {
    Container.dependencies.clear();
  }
}

/**
 * Service locator for easier access
 */
export const getService = <T = unknown>(key: string): T => Container.resolve<T>(key);

/**
 * Register service
 */
export const registerService = <T>(key: string, dependency: T): void => {
  Container.register(key, dependency);
};

/**
 * Register singleton service
 */
export const registerSingletonService = <T>(key: string, factory: () => T): void => {
  Container.registerSingleton(key, factory);
};
