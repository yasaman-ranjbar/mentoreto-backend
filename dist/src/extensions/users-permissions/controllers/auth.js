"use strict";
/**
 * Auth.ts controller
 *
 * @description: A set of functions called "actions" for managing authentication and role selection.
 */
const { sanitize } = require("@strapi/utils");
module.exports = (plugin) => {
    // Get the default auth controller
    const defaultAuthController = plugin.controllers.auth;
    // Add our custom selectRole method
    plugin.controllers.auth = {
        ...defaultAuthController,
        async selectRole(ctx) {
            var _a;
            try {
                const { role } = ctx.request.body;
                const userId = (_a = ctx.state.user) === null || _a === void 0 ? void 0 : _a.id;
                // Check if user is authenticated
                if (!userId) {
                    return ctx.unauthorized("You must be authenticated to select a role");
                }
                // Validate the role
                if (!role || !["mentor", "mentee"].includes(role)) {
                    return ctx.badRequest('Role must be either "mentor" or "mentee"');
                }
                // Get current user
                const user = await strapi.entityService.findOne("plugin::users-permissions.user", userId, {
                    populate: ["role"],
                });
                if (!user) {
                    return ctx.notFound("User not found");
                }
                // Check if user already has a custom role
                if (user.customRole) {
                    return ctx.badRequest("User already has a role assigned");
                }
                // Update user with the selected role
                const updatedUser = await strapi.entityService.update("plugin::users-permissions.user", userId, {
                    data: {
                        customRole: role,
                    },
                    populate: ["role"],
                });
                // Sanitize the response to remove sensitive data
                const sanitizedUser = await sanitize.contentAPI.output(updatedUser, strapi.getModel("plugin::users-permissions.user"));
                // Send response
                ctx.send({
                    jwt: strapi.plugins["users-permissions"].services.jwt.issue({
                        id: updatedUser.id,
                    }),
                    user: sanitizedUser,
                    message: `Role "${role}" selected successfully`,
                });
            }
            catch (error) {
                strapi.log.error("Error in selectRole:", error);
                return ctx.internalServerError("Internal server error");
            }
        },
        async getProfile(ctx) {
            var _a;
            try {
                const userId = (_a = ctx.state.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return ctx.unauthorized("You must be authenticated to view profile");
                }
                const user = await strapi.entityService.findOne("plugin::users-permissions.user", userId, {
                    populate: ["role"],
                });
                if (!user) {
                    return ctx.notFound("User not found");
                }
                const sanitizedUser = await sanitize.contentAPI.output(user, strapi.getModel("plugin::users-permissions.user"));
                ctx.send({
                    user: sanitizedUser,
                });
            }
            catch (error) {
                strapi.log.error("Error in getProfile:", error);
                return ctx.internalServerError("Internal server error");
            }
        },
    };
    return plugin;
};
