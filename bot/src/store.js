import fs from 'node:fs';
import path from 'node:path';

/**
 * Crash-safe JSON persistence. Writes go to a temp file and are renamed into
 * place, so an interrupted write can never leave a half-written portfolio
 * behind. Everything here is synchronous — the files are small and the
 * simplicity is worth more than the microseconds.
 */
export class JsonStore {
  constructor(dir, filename, initial) {
    this.dir = dir;
    this.file = path.join(dir, filename);
    this.initial = initial;
  }

  read() {
    if (!fs.existsSync(this.file)) return structuredClone(this.initial);
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch (error) {
      const backup = `${this.file}.corrupt-${Date.now()}`;
      fs.renameSync(this.file, backup);
      throw new Error(`${this.file} was unreadable (${error.message}); moved to ${backup}`);
    }
  }

  write(data) {
    fs.mkdirSync(this.dir, { recursive: true });
    const temp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`);
    fs.renameSync(temp, this.file);
    return data;
  }

  update(mutator) {
    const data = this.read();
    const next = mutator(data) ?? data;
    return this.write(next);
  }

  exists() {
    return fs.existsSync(this.file);
  }
}

/** Append one JSON object per line. Used for the signal log. */
export function appendJsonl(dir, filename, record) {
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, filename), `${JSON.stringify(record)}\n`);
}

export function readJsonl(dir, filename, { limit = Infinity } = {}) {
  const file = path.join(dir, filename);
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  const slice = Number.isFinite(limit) ? lines.slice(-limit) : lines;
  return slice.flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
}
