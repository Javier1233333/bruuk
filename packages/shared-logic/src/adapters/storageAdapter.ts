export interface IStorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export let storageAdapter: IStorageAdapter;

export function setStorageAdapter(adapter: IStorageAdapter) {
  storageAdapter = adapter;
}
