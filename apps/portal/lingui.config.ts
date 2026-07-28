import linguiConfig from "@modular-vsa/i18n/config";

export default {
  ...linguiConfig,
  catalogs: [
    {
      path: "../../packages/_i18n/locales/{locale}",
      include: [
        "./src",
        "../../packages/__shared__/src/web",
        "../../packages/auth/src/web",
        "../../packages/home/src/web",
      ],
    },
  ],
};
