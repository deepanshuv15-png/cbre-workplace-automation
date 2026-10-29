// utils/logger.ts
// Minimal timestamped logger so test steps are easy to follow in CI logs.
type Level = 'INFO' | 'WARN' | 'ERROR';

function log(level: Level, message: string) {
  console.log(`[${new Date().toISOString()}] [${level}] ${message}`);
}

export const logger = {
  info: (m: string) => log('INFO', m),
  warn: (m: string) => log('WARN', m),
  error: (m: string) => log('ERROR', m),
};
