/** Mirrors Prisma enums — keep in sync with packages/database schema */

export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Plan = {
  FREE: 'FREE',
  PAID: 'PAID',
} as const;
export type Plan = (typeof Plan)[keyof typeof Plan];

export const SubscriptionStatus = {
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED',
  UNPAID: 'UNPAID',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const NumberState = {
  UNKNOWN: 'UNKNOWN',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  RESTARTING: 'RESTARTING',
  ERROR: 'ERROR',
} as const;
export type NumberState = (typeof NumberState)[keyof typeof NumberState];

export const HealthStatus = {
  HEALTHY: 'HEALTHY',
  UNHEALTHY: 'UNHEALTHY',
} as const;
export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];

export const ErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  INSTANCE_NOT_FOUND: 'INSTANCE_NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN: 'UNKNOWN',
} as const;
export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

export const AlertChannel = {
  MONITOR_STATUS: 'MONITOR_STATUS',
  EMAIL: 'EMAIL',
  WEBHOOK: 'WEBHOOK',
} as const;
export type AlertChannel = (typeof AlertChannel)[keyof typeof AlertChannel];

export const RetryStrategy = {
  FIXED: 'FIXED',
  EXPONENTIAL_JITTER: 'EXPONENTIAL_JITTER',
} as const;
export type RetryStrategy = (typeof RetryStrategy)[keyof typeof RetryStrategy];

/** Evolution server product line — mirrors Prisma `EvolutionFlavor` */
export const EvolutionFlavor = {
  EVOLUTION_V2: 'EVOLUTION_V2',
  EVOLUTION_GO: 'EVOLUTION_GO',
} as const;
export type EvolutionFlavor = (typeof EvolutionFlavor)[keyof typeof EvolutionFlavor];

export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];
