export default {
  async forgotPassword(ctx) {
    console.log("🔥 CUSTOM FORGOT PASSWORD OVERRIDE IS ACTIVE");

    const pluginStore = strapi.store({
      type: "plugin",
      name: "users-permissions",
    });

    const { email } = ctx.request.body;

    if (!email) {
      return ctx.badRequest("Missing email");
    }

    const user = await strapi.query("plugin::users-permissions.user").findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) return ctx.send({ ok: true });

    const code = strapi
      .plugin("users-permissions")
      .service("user")
      .generateResetToken(user);

    const resetURL = `${
      process.env.RESET_PASSWORD_URL ||
      "http://localhost:3000/auth/reset-password"
    }?code=${code}`;

    await strapi
      .plugin("email")
      .service("email")
      .send({
        to: user.email,
        subject: "Reset your password",
        text: `Click here to reset your password:\n\n${resetURL}`,
      });

    return ctx.send({ ok: true });
  },
};
