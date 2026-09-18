import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 09:00 in Lima (UTC-5, no daylight saving): post a notice on claims close to the deadline.
crons.daily("warn claims near their deadline", { hourUTC: 14, minuteUTC: 0 }, internal.claims.warnDeadlines, {});

export default crons;
