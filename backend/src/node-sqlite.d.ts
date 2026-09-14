declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(filename: string);
    exec(sql: string): void;
    prepare(sql: string): {
      get(...parameters: unknown[]): any;
      all(...parameters: unknown[]): any[];
      run(...parameters: unknown[]): any;
    };
  }
}
