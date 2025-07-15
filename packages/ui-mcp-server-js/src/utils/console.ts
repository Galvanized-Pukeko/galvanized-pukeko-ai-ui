import {appendFileSync} from 'fs';
import {join} from 'path';
import {homedir} from 'os';

export const loggingConfig = {
  logToFile: false
};

const LOG_FILE = join(homedir(), 'galvanized-pukeko-ui.log');

const formatMessage = (level: string, ...args: any[]): string => {
  const timestamp = new Date().toISOString();
  const message = args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  return `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
};

const writeToFile = (level: string, ...args: any[]) => {
  try {
    const logMessage = formatMessage(level, ...args);
    appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    // Fallback to console if file writing fails
    console.error('Failed to write to log file:', error);
  }
};

export const log = (...args: any[]) => {
  if (loggingConfig.logToFile) {
    writeToFile('info', ...args);
  } else {
    console.log(...args);
  }
};

export const error = (...args: any[]) => {
  if (loggingConfig.logToFile) {
    writeToFile('error', ...args);
  } else {
    console.error(...args);
  }
};

export const warn = (...args: any[]) => {
  if (loggingConfig.logToFile) {
    writeToFile('warn', ...args);
  } else {
    console.warn(...args);
  }
};

export const info = (...args: any[]) => {
  if (loggingConfig.logToFile) {
    writeToFile('info', ...args);
  } else {
    console.info(...args);
  }
};

export const debug = (...args: any[]) => {
  if (loggingConfig.logToFile) {
    writeToFile('debug', ...args);
  } else {
    console.debug(...args);
  }
};
