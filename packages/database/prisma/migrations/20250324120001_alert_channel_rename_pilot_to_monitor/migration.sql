-- Align `AlertChannel` enum with current schema (`MONITOR_STATUS`).
ALTER TYPE "AlertChannel" RENAME VALUE 'PILOT_STATUS' TO 'MONITOR_STATUS';
