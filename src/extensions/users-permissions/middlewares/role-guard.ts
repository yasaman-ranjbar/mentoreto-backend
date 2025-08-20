"use strict";

/**
 * Role Guard Middleware
 * Ensures users have selected a role before accessing certain endpoints
 */

// Using Koa context methods for better compatibility

module.exports = (config = {}) => {
  return async (ctx, next) => {
    const user = ctx.state.user;

    if (!user) {
      ctx.throw(401, "Authentication required");
    }

    // Check if user has selected a custom role
    if (!user.customRole) {
      // Allow access to role selection endpoint and auth endpoints
      const allowedPaths = [
        "/api/auth/select-role",
        "/api/auth/me",
        "/api/auth/logout",
      ];

      const currentPath = ctx.request.path;

      if (!allowedPaths.includes(currentPath)) {
        ctx.throw(
          403,
          "Please select your role (mentor or mentee) before accessing this resource",
          {
            details: {
              code: "ROLE_SELECTION_REQUIRED",
              redirectTo: "/select-role",
            },
          }
        );
      }
    }

    await next();
  };
};

/**
 * Role-specific middleware factory
 * Creates middleware that ensures user has a specific role
 */
module.exports.requireRole = (requiredRole) => {
  return async (ctx, next) => {
    const user = ctx.state.user;

    if (!user) {
      ctx.throw(401, "Authentication required");
    }

    if (user.customRole !== requiredRole) {
      ctx.throw(
        403,
        `Access denied. This endpoint requires ${requiredRole} role.`,
        {
          details: {
            code: "INSUFFICIENT_ROLE",
            requiredRole,
            userRole: user.customRole,
          },
        }
      );
    }

    await next();
  };
};
