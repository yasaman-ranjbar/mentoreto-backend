"use strict";
/**
 * Custom auth routes
 */
module.exports = {
    type: "content-api",
    routes: [
        {
            method: "POST",
            path: "/auth/select-role",
            handler: "auth.selectRole",
            config: {
                middlewares: ["plugin::users-permissions.rateLimit"],
                prefix: "",
                policies: [],
            },
        },
        {
            method: "GET",
            path: "/auth/me",
            handler: "auth.getProfile",
            config: {
                prefix: "",
                policies: [],
            },
        },
    ],
};
