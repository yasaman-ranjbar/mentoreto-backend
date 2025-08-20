"use strict";

/**
 * A set of functions called "actions" for the `role-selection` API
 */

module.exports = {
  async assignRole(ctx) {
    
    const user = ctx.state.user;

    if (!user) {
      return ctx.badRequest("User not authenticated.");
    }

    const { roleName } = ctx.request.body;

    if (!roleName) {
      return ctx.badRequest("Role name is required.");
    }

    try {
      const role = await strapi
        .query("plugin::users-permissions.role")
        .findOne({
          where: { name: roleName },
        });

      if (!role) {
        return ctx.notFound("Role not found.");
      }

      await strapi.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: {
          role: role.id,
        },
      });

      ctx.send({
        success: true,
        message: `User role successfully updated to ${roleName}.`,
      });
    } catch (error) {
      strapi.log.error(error);
      return ctx.internalServerError(
        "An error occurred while assigning the role."
      );
    }
  },
};
