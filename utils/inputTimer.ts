interface Session { startedAt: number; durationMs: number; }

export class InputTimer {
  private readonly key: string;
  private startedAt: number | null = null;

  constructor(scope: string) {
    this.key = `jhcrm:inputTimer:${scope}`;
  }

  start() { this.startedAt = Date.now(); }

  stop() {
    if (this.startedAt == null) return;
    const session: Session = {
      startedAt: this.startedAt,
      durationMs: Date.now() - this.startedAt,
    };
    const all = this.readAll();
    all.push(session);
    localStorage.setItem(this.key, JSON.stringify(all));
    this.startedAt = null;
  }

  readAll(): Session[] {
    try { return JSON.parse(localStorage.getItem(this.key) ?? '[]'); }
    catch { return []; }
  }

  median(): number {
    const ms = this.readAll().map(s => s.durationMs).sort((a, b) => a - b);
    if (ms.length === 0) return 0;
    const mid = Math.floor(ms.length / 2);
    return ms.length % 2 ? ms[mid] : (ms[mid - 1] + ms[mid]) / 2;
  }
}
