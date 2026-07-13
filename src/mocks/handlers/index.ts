import { authHandlers } from './auth';
import { analysisHandlers } from './analysis';

export const handlers = [...authHandlers, ...analysisHandlers];
