/** Tiny leveled logger with ANSI colour when stdout is a TTY. */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

const useColor = process.stdout.isTTY && process.env.NO_COLOR === undefined;

const paint = (code) => (useColor ? `[${code}m` : '');

const C = {
  reset: paint(0),
  dim: paint(2),
  bold: paint(1),
  red: paint(31),
  green: paint(32),
  yellow: paint(33),
  blue: paint(34),
  magenta: paint(35),
  cyan: paint(36),
};

export const color = C;

let threshold = LEVELS[process.env.MEMEBOT_LOG_LEVEL ?? 'info'] ?? LEVELS.info;

export function setLevel(level) {
  if (LEVELS[level] === undefined) throw new Error(`unknown log level: ${level}`);
  threshold = LEVELS[level];
}

function stamp() {
  return `${C.dim}${new Date().toISOString().slice(11, 19)}${C.reset}`;
}

function emit(level, prefix, args) {
  if (LEVELS[level] < threshold) return;
  const stream = LEVELS[level] >= LEVELS.warn ? console.error : console.log;
  stream(`${stamp()} ${prefix}`, ...args);
}

export const log = {
  debug: (...args) => emit('debug', `${C.dim}debug${C.reset}`, args),
  info: (...args) => emit('info', `${C.blue}info ${C.reset}`, args),
  warn: (...args) => emit('warn', `${C.yellow}warn ${C.reset}`, args),
  error: (...args) => emit('error', `${C.red}error${C.reset}`, args),
  /** Plain stdout, never filtered — for command output the user asked for. */
  print: (...args) => console.log(...args),
};
