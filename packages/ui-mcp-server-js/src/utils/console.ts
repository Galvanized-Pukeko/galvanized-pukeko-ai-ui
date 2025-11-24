import {appendFileSync} from 'fs';
import {join} from 'path';
import {homedir} from 'os';

export const loggingConfig = {
  logToFile: false
};

const LOG_FILE = join(homedir(), 'galvanized-pukeko-ui.log');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatMessage = (level: string, ...args: any[]): string => {
  const timestamp = new Date().toISOString();
  const message = args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  return `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const writeToFile = (level: string, ...args: any[]) => {
  try {
    const logMessage = formatMessage(level, ...args);
    appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    // Fallback to console if file writing fails
    console.error('Failed to write to log file:', error);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const log = (...args: any[]) => {
  if (loggingConfig.logToFile) {
    writeToFile('info', ...args);
  } else {
    console.log(...args);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const error = (...args: any[]) => {
  if (loggingConfig.logToFile) {
    writeToFile('error', ...args);
  } else {
    console.error(...args);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const warn = (...args: any[]) => {
  if (loggingConfig.logToFile) {
    writeToFile('warn', ...args);
  } else {
    console.warn(...args);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const info = (...args: any[]) => {
  if (loggingConfig.logToFile) {
    writeToFile('info', ...args);
  } else {
    console.info(...args);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debug = (...args: any[]) => {
  if (loggingConfig.logToFile) {
    writeToFile('debug', ...args);
  } else {
    console.debug(...args);
  }
};
