"use strict";
module.exports = (plugin) => {
    // Register custom auth controller
    const authController = require("./controllers/auth");
    plugin = authController(plugin);
    // Register custom routes
    plugin.routes["content-api"].routes.push(...require("./routes/auth").routes);
    return plugin;
};
