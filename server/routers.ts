import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { accountsRouter } from "./routers/accounts.router";
import { extractionRouter } from "./routers/extraction.router";
import { bulkOpsRouter } from "./routers/bulk-ops.router";
import { statsRouter } from "./routers/stats.router";
import { proxiesRouter } from "./routers/proxies.router";
import { dashboardRouter } from "./routers/dashboard.router";
import { setupRouter } from "./routers/setup.router";
import { antiBanRouter } from "./routers/anti-ban";
import { licenseRouter } from "./routers/license";
import { permissionRouter } from "./routers/permission.router";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Dragon Telegram Pro routers
  dashboard: dashboardRouter,
  accounts: accountsRouter,
  extraction: extractionRouter,
  bulkOps: bulkOpsRouter,
  stats: statsRouter,
  proxies: proxiesRouter,
  setup: setupRouter,
  antiBan: antiBanRouter,
  license: licenseRouter,
  permission: permissionRouter,
});

export type AppRouter = typeof appRouter;
