"use strict";

module.exports = {
  routes: [
    {
      method: "POST",
      path: "/role-selection/assign-role",
      handler: "role-selection.assignRole",
      config: {
        policies: ["global::is-authenticated"],
        middlewares: [],
      },
    },
  ],
};
