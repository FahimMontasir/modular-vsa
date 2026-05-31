import linguiConfig from "@modular-vsa/i18n/config";

export default {
  ...linguiConfig,
  catalogs: [
    {
      path: "../../packages/_i18n/locales/{locale}",
      include: ["./src"],
    },
  ],
};
