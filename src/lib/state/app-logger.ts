/**
 * In-memory ring-buffer logger. Ported from
 * `lib/services/app_logger.dart` upstream. The Logs screen reads
 * from this; the NLE client appends through it.
 *
 * Only stores plain strings + a small data payload — never credential
 * values. The `info()` helper called at NleClient construction time
 * receives a presence label (`bearer` / `cf-service-token` / `none`),
 * not the value itself.
 */

export interface LogEntry {
  readonly id: number;
  readonly timestamp: string; // ISO
  readonly level: 'debug' | 'info' | 'warn' | 'error';
  readonly message: string;
  readonly data?: Record<string, unknown>;
}

type Listener = (entries: readonly LogEntry[]) => void;

const RING_CAPACITY = 500;

class AppLoggerImpl {
  private entries: LogEntry[] = [];
  private nextId = 1;
  private listeners = new Set<Listener>();

  list(): readonly LogEntry[] {
    return this.entries;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private push(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
    const full: LogEntry = {
      id: this.nextId++,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.entries = [...this.entries, full];
    if (this.entries.length > RING_CAPACITY) {
      this.entries = this.entries.slice(-RING_CAPACITY);
    }
    for (const l of this.listeners) l(this.entries);
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.push({ level: 'debug', message, data });
  }
  info(message: string, data?: Record<string, unknown>) {
    this.push({ level: 'info', message, data });
  }
  warn(message: string, data?: Record<string, unknown>) {
    this.push({ level: 'warn', message, data });
  }
  error(message: string, data?: Record<string, unknown>) {
    this.push({ level: 'error', message, data });
  }

  /**
   * Convenience used by the write path. Logs the command name and
   * value (never any credential — the headers are stripped before
   * this is called).
   */
  commandIssued(command: string, value: unknown) {
    this.push({
      level: 'info',
      message: `command issued: ${command}`,
      data: { command, value },
    });
  }

  clear() {
    this.entries = [];
    for (const l of this.listeners) l(this.entries);
  }
}

export const AppLogger = new AppLoggerImpl();
export type { AppLoggerImpl };
