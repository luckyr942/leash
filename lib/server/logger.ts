// Minimal structured logger. One JSON line per event in production (easy to search in Render's logs),
// readable single lines in development. The only module allowed to touch the console.
type Level = "debug" | "info" | "warn" | "error";
type Meta = Record<string, unknown>;

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const minLevel = (): Level => (process.env.LOG_LEVEL as Level) ?? (process.env.NODE_ENV === "production" ? "info" : "debug");

function serialise(meta: Meta = {}): Meta {
  const out: Meta = {};
  for (const [k, v] of Object.entries(meta)) {
    out[k] = v instanceof Error ? { name: v.name, message: v.message, stack: v.stack } : v;
  }
  return out;
}

function write(level: Level, msg: string, meta?: Meta) {
  if (ORDER[level] < ORDER[minLevel()] || process.env.NODE_ENV === "test") return;
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (process.env.NODE_ENV === "production") {
    sink(JSON.stringify({ time: new Date().toISOString(), level, msg, ...serialise(meta) }));
  } else {
    sink(`[leash] ${level.padEnd(5)} ${msg}`, ...(meta ? [serialise(meta)] : []));
  }
}

export const log = {
  debug: (msg: string, meta?: Meta) => write("debug", msg, meta),
  info: (msg: string, meta?: Meta) => write("info", msg, meta),
  warn: (msg: string, meta?: Meta) => write("warn", msg, meta),
  error: (msg: string, meta?: Meta) => write("error", msg, meta),
};
