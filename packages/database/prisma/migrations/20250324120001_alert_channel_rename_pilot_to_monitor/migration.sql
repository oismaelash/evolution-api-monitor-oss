-- Rename enum value to match Evolution API Monitor naming (Pilot → monitor).
ALTER TYPE "AlertChannel" RENAME VALUE 'PILOT_STATUS' TO 'MONITOR_STATUS';
