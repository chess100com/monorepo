export type UciLineListener = (line: string) => void;
export type UciUnsubscribe = () => void;

export interface UciEngine {
  send(cmd: string): void;
  onLine(listener: UciLineListener): UciUnsubscribe;
  writeFile(path: string, content: string): void;
  quit(): void | Promise<void>;
}
