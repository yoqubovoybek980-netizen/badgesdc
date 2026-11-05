(() => {
  const { findByName, findByStoreName } = vendetta.metro;
  const { after } = vendetta.patcher;

  const CDN = "https://cdn.discordapp.com/badge-icons/";
  // [nom, rasm hash]. Rasm chiqmasa shu yerda hash/URL ni almashtiring.
  const BADGES = [
    ["Discord Nitro", "2ba85e8026a8614b640c2837bcdfe21b"],
    ["Server Booster", "51040c70d4f20a921ad6674ff86fc95c"],
    ["Early Supporter", "7060786766c9c840eb3019e725d2b358"],
    ["HypeSquad Bravery", "8a88d63823d8a71cd5e390baa45efa02"],
    ["HypeSquad Brilliance", "011940fd013da3f7fb926e4a1cd2e618"],
    ["HypeSquad Balance", "3aa41de486fa12454c3761e8e223442e"],
    ["Discord Bug Hunter", "2717692c7dca7289b35297368a940dd0"],
    ["Active Developer", "6bdc42827a38498929a4920da12695d9"],
    ["Discord Staff", "5e74e9b61934fc1f67c65515d1f7e60d"],
    ["Partnered Server Owner", "3f9748e53446a137a052f3454e2de41e"],
    ["Moderator Programs Alumni", "fee1624003e2fee35cb398e125dc479b"],
    ["Early Verified Bot Developer", "6df5892e0f35b051f8b61eace34f4967"],
  ];

  const PREFIX = "localbadge-";
  const props = {};
  let unpatch;
  let jsxCb;

  return {
    onLoad() {
      const UserStore = findByStoreName("UserStore");
      const useBadges = findByName("useBadges", false);
      const jsx = globalThis.bunny.api.react.jsx;

      jsxCb = (_, ret) => {
        const id = ret?.props?.id;
        if (typeof id === "string" && props[id]) Object.assign(ret.props, props[id]);
      };
      jsx.onJsxCreate("RenderedBadge", jsxCb);

      unpatch = after("default", useBadges, ([user], r) => {
        if (!user || !Array.isArray(r)) return;
        const me = UserStore.getCurrentUser?.()?.id;
        if (!me || user.userId !== me) return; // faqat o'zingizda

        BADGES.forEach(([label, hash], i) => {
          const id = PREFIX + i;
          if (r.some((b) => b && b.id === id)) return;
          props[id] = { source: { uri: CDN + hash + ".png" }, id, label };
          r.push({ id, description: label, icon: "_" });
        });
      });
    },

    onUnload() {
      unpatch?.();
      if (jsxCb) globalThis.bunny.api.react.jsx.deleteJsxCreate("RenderedBadge", jsxCb);
    },
  };
})()
