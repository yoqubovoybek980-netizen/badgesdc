(() => {
  const { findByProps } = vendetta.metro;
  const { after } = vendetta.patcher;
  const { React, ReactNative, clipboard } = vendetta.metro.common;
  const { FormSection, FormRow } = vendetta.ui.components.Forms;
  const h = React.createElement;

  const seen = new Map(); // komponent nomi -> {count, props}
  let unpatches = [];

  const brief = (props) => {
    const out = {};
    try {
      Object.keys(props || {}).slice(0, 25).forEach((k) => {
        const v = props[k];
        let d = typeof v;
        if (Array.isArray(v)) {
          d = "array(" + v.length + ")";
          if (v[0] && typeof v[0] === "object") d += " first{" + Object.keys(v[0]).slice(0, 8).join(",") + "}";
        } else if (v && typeof v === "object") d = "object{" + Object.keys(v).slice(0, 8).join(",") + "}";
        else if (typeof v === "string") d = "string:" + v.slice(0, 40);
        out[k] = d;
      });
    } catch (e) {}
    return out;
  };

  const nameOf = (C) => {
    try {
      if (typeof C === "function") return C.displayName || C.name;
      if (C && typeof C === "object") return C.displayName || C.type?.name || C.render?.name || C.type?.displayName;
    } catch (e) {}
  };

  function exportsScan() {
    const lines = [];
    try {
      const mods = vendetta.metro.modules;
      for (const id in mods) {
        const m = mods[id];
        if (!m || !m.isInitialized) continue;
        let ex;
        try { ex = m.publicModule && m.publicModule.exports; } catch (e) { continue; }
        if (!ex || (typeof ex !== "object" && typeof ex !== "function")) continue;
        let keys;
        try { keys = Object.keys(ex); } catch (e) { continue; }
        const hit = keys.filter((k) => /badge/i.test(k));
        let dn = "";
        try {
          const d = Object.getOwnPropertyDescriptor(ex, "default");
          if (d && typeof d.value === "function" && /badge/i.test(d.value.name || "")) dn = "default=" + d.value.name;
        } catch (e) {}
        if (hit.length || dn) lines.push(id + ": " + [...hit, dn].filter(Boolean).join(", "));
        if (lines.length >= 150) break;
      }
    } catch (e) { lines.push("scan xato: " + e); }
    return lines;
  }

  function report() {
    const comps = [...seen.entries()].map(([n, v]) => n + " x" + v.count + " " + JSON.stringify(v.props));
    return "== KOMPONENTLAR (nomida 'badge') ==\n" + (comps.join("\n") || "(yo'q)") +
      "\n\n== EKSPORTLAR (nomida 'badge') ==\n" + (exportsScan().join("\n") || "(yo'q)");
  }

  function Settings() {
    const { ScrollView } = ReactNative;
    return h(ScrollView, { style: { flex: 1 } },
      h(FormSection, { title: "BadgeFinder" },
        h(FormRow, { label: "1) Discord'da 'Your badges' ekranini oching", subLabel: "Keyin shu yerga qaytib, pastdagi tugmani bosing." }),
        h(FormRow, { label: "2) Hisobotni nusxalash", subLabel: "Bosing, keyin Claude chatiga joylang (paste).",
          onPress: () => {
            try { clipboard.setString(report()); vendetta.ui.toasts.showToast("Nusxalandi"); }
            catch (e) { vendetta.ui.toasts.showToast("Xato: " + e); }
          } })));
  }

  return {
    onLoad() {
      const rt = findByProps("jsx", "jsxs");
      const cb = ([C, props]) => {
        const n = nameOf(C);
        if (!n || !/badge/i.test(n)) return;
        const e = seen.get(n) || { count: 0, props: null };
        e.count++;
        if (!e.props) e.props = brief(props);
        seen.set(n, e);
      };
      unpatches = [after("jsx", rt, cb), after("jsxs", rt, cb)];
    },
    onUnload() { unpatches.forEach((u) => u && u()); },
    settings: Settings,
  };
})()
