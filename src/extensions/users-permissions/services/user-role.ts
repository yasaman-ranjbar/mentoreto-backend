"use strict";

/**
 * User role service for handling custom role operations
 */

// Using standard JavaScript errors for better compatibility

module.exports = {
  /**
   * Check if a user can select a role
   * @param {number} userId - The user ID
   * @returns {Promise<boolean>}
   */
  async canSelectRole(userId) {
    const user = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      userId
    );

    if (!user) {
      throw new Error("User not found");
    }

    // User can select a role if they don't have a custom role yet
    return !user.customRole;
  },

  /**
   * Get users by custom role
   * @param {string} role - The role to filter by (mentor|mentee)
   * @param {object} options - Additional query options
   * @returns {Promise<Array>}
   */
  async getUsersByRole(role, options = {}) {
    if (!["mentor", "mentee"].includes(role)) {
      throw new Error("Invalid role specified");
    }

    return await strapi.entityService.findMany(
      "plugin::users-permissions.user",
      {
        filters: {
          customRole: role,
        },
        ...options,
      }
    );
  },

  /**
   * Get role statistics
   * @returns {Promise<object>}
   */
  async getRoleStats() {
    const mentors = await this.getUsersByRole("mentor", {
      publicationState: "live",
    });
    const mentees = await this.getUsersByRole("mentee", {
      publicationState: "live",
    });
    const usersWithoutRole = await strapi.entityService.findMany(
      "plugin::users-permissions.user",
      {
        filters: {
          customRole: null,
        },
      }
    );

    return {
      mentors: mentors.length,
      mentees: mentees.length,
      pendingRoleSelection: usersWithoutRole.length,
      total: mentors.length + mentees.length + usersWithoutRole.length,
    };
  },

  /**
   * Validate role selection request
   * @param {string} role - The role to validate
   * @param {number} userId - The user ID
   * @returns {Promise<void>}
   */
  async validateRoleSelection(role, userId) {
    if (!role || !["mentor", "mentee"].includes(role)) {
      throw new Error('Role must be either "mentor" or "mentee"');
    }

    const canSelect = await this.canSelectRole(userId);
    if (!canSelect) {
      throw new Error("User already has a role assigned");
    }
  },
};
