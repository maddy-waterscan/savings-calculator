(function () {
  // Global config. Override by defining window.WS_CONFIG before this script runs.
  const WS_DEFAULT_CONFIG = {
    i18n: {
      locale: "en-GB",
      currency: "GBP",
    },
    caps: {
      grossSavingPct: 0.6, // 60%
      barSavePct: 0.8, // 80% visual cap
    },
    inputs: {
      sites: { min: 1, max: 200, step: 1, value: 5, label: "Number of sites" },
      use: {
        min: 100,
        max: 500000,
        step: 100,
        value: 20000,
        label: "Average annual water use per site (m³)",
      },
      tariff: {
        min: 0.1,
        max: 10,
        step: 0.05,
        value: 2.2,
        label: "Current water cost (£ per m³)",
      },
      eff: {
        min: 0,
        max: 30,
        step: 1,
        value: 8,
        label: "Expected efficiency gain (%)",
      },
      leak: {
        min: 0,
        max: 30,
        step: 1,
        value: 5,
        label: "Leak loss reduction (%)",
      },
      service: {
        min: 0,
        max: 500000,
        step: 100,
        value: 25000,
        label: "Annual Waterscan service fee (£)",
      },
      co2: {
        min: 0,
        max: 2,
        step: 0.01,
        value: 0.34,
        label: "Carbon factor (kg CO₂e per m³)",
      },
    },
    chart: {
      // no style here to keep CSS separate
    },
    texts: {
      title: "Water and Cost Savings Estimator",
      sub: "Adjust the sliders or type values. Results update live.",
      kpiWater: "Estimated water saved per year",
      kpiMoney: "Gross cost savings per year",
      kpiNet: "Net savings after fees",
      kpiCO2: "Estimated emissions avoided per year",
      legBase: "Current spend",
      legSave: "Potential net saving",
      cta: "Request a detailed assessment",
      note: "Outputs are indicative without making any claims. Confirm Calculations with Barry or Neil???",
    },
  };

  const CFG = Object.assign({}, WS_DEFAULT_CONFIG, window.WS_CONFIG || {});
  const I18N = CFG.i18n;

  const el = (id) => document.getElementById(id);
  const qs = (sel) => document.querySelector(sel);

  // Apply labels and placeholders from config
  function applyConfig() {
    // Labels
    const labelMap = {
      wsSites: "sites",
      wsUse: "use",
      wsTariff: "tariff",
      wsEff: "eff",
      wsLeak: "leak",
      wsService: "service",
      wsCO2: "co2",
    };
    Object.entries(labelMap).forEach(([id, key]) => {
      const labelEl = document.querySelector(`label[for='${id}']`);
      if (labelEl && CFG.inputs[key]?.label)
        labelEl.textContent = CFG.inputs[key].label;
    });

    // Texts
    const title = qs(".ws-title");
    if (title) title.textContent = CFG.texts.title;
    const sub = qs(".ws-sub");
    if (sub) sub.textContent = CFG.texts.sub;
    const cta = el("wsCTA");
    if (cta) cta.textContent = CFG.texts.cta;
    const note = qs(".ws-note");
    if (note) note.textContent = CFG.texts.note;
    const legBase = qs(".ws-leg-base");
    if (legBase) legBase.textContent = CFG.texts.legBase;
    const legSave = qs(".ws-leg-save");
    if (legSave) legSave.textContent = CFG.texts.legSave;
    qs("#wsWaterSaved")?.nextElementSibling &&
      (qs("#wsWaterSaved").nextElementSibling.textContent = CFG.texts.kpiWater);
    qs("#wsMoneySaved")?.nextElementSibling &&
      (qs("#wsMoneySaved").nextElementSibling.textContent = CFG.texts.kpiMoney);
    qs("#wsNetSavings")?.nextElementSibling &&
      (qs("#wsNetSavings").nextElementSibling.textContent = CFG.texts.kpiNet);
    qs("#wsCO2Saved")?.nextElementSibling &&
      (qs("#wsCO2Saved").nextElementSibling.textContent = CFG.texts.kpiCO2);

    // Ranges and defaults
    function setAttrs(id, meta) {
      const range = el(id);
      const num = el(id + "Num");
      if (!range || !num || !meta) return;
      ["min", "max", "step", "value"].forEach((k) => {
        if (meta[k] !== undefined) {
          range[k] = meta[k];
          num[k] = meta[k];
        }
      });
    }
    const inp = CFG.inputs;
    setAttrs("wsSites", inp.sites);
    setAttrs("wsUse", inp.use);
    setAttrs("wsTariff", inp.tariff);
    setAttrs("wsEff", inp.eff);
    setAttrs("wsLeak", inp.leak);
    setAttrs("wsService", inp.service);
    setAttrs("wsCO2", inp.co2);
  }

  // Parse URL params as overrides, so you can share prefilled links
  function readOverridesFromURL() {
    const p = new URLSearchParams(location.search);
    const override = {};
    ["sites", "use", "tariff", "eff", "leak", "service", "co2"].forEach((k) => {
      if (p.has(k)) override[k] = parseFloat(p.get(k));
    });
    return override;
  }

  const sites = el("wsSites");
  const sitesNum = el("wsSitesNum");
  const use = el("wsUse");
  const useNum = el("wsUseNum");
  const tariff = el("wsTariff");
  const tariffNum = el("wsTariffNum");
  const eff = el("wsEff");
  const effNum = el("wsEffNum");
  const leak = el("wsLeak");
  const leakNum = el("wsLeakNum");
  const service = el("wsService");
  const serviceNum = el("wsServiceNum");
  const co2 = el("wsCO2");
  const co2Num = el("wsCO2Num");

  const outWater = el("wsWaterSaved");
  const outMoney = el("wsMoneySaved");
  const outNet = el("wsNetSavings");
  const outCO2 = el("wsCO2Saved");

  const barBase = el("wsBarBase");
  const barSave = el("wsBarSave");

  function bindPair(rangeEl, numEl) {
    rangeEl.addEventListener("input", () => {
      numEl.value = rangeEl.value;
      calc();
    });
    numEl.addEventListener("input", () => {
      rangeEl.value = numEl.value;
      calc();
    });
  }

  function fmtGBP(x) {
    return new Intl.NumberFormat(I18N.locale, {
      style: "currency",
      currency: I18N.currency,
      maximumFractionDigits: 0,
    }).format(x || 0);
  }
  function fmtNum(x) {
    return new Intl.NumberFormat(I18N.locale).format(Math.round(x || 0));
  }

  function calc() {
    const nSites = +sites.value;
    const usePerSite = +use.value;
    const price = +tariff.value;
    const effP = +eff.value;
    const leakP = +leak.value;
    const fee = +service.value;
    const cf = +co2.value;

    const totalUsage = nSites * usePerSite;
    const grossPct = Math.min(
      CFG.caps.grossSavingPct,
      Math.max(0, (effP + leakP) / 100)
    );
    const waterSaved = totalUsage * grossPct;
    const baseSpend = totalUsage * price;
    const moneySaved = waterSaved * price;
    const netSavings = moneySaved - fee;
    const co2SavedT = (waterSaved * cf) / 1000;

    outWater.textContent = fmtNum(waterSaved) + " m³";
    outMoney.textContent = fmtGBP(moneySaved);
    outNet.textContent = fmtGBP(netSavings);
    outCO2.textContent = co2SavedT.toFixed(1) + " tCO₂e";

    const netPos = Math.max(0, netSavings);
    const savePct =
      baseSpend > 0
        ? Math.min(CFG.caps.barSavePct * 100, (netPos / baseSpend) * 100)
        : 0;
    barSave.style.width = savePct + "%";
    barBase.style.width = 100 - savePct + "%";

    const payload = {
      nSites,
      usePerSite,
      price,
      effP,
      leakP,
      fee,
      cf,
      waterSaved,
      moneySaved,
      netSavings,
      baseSpend,
    };
    document
      .getElementById("waterscan-calculator")
      .dispatchEvent(new CustomEvent("ws:update", { detail: payload }));
  }

  // Init
  applyConfig();

  // Apply URL overrides
  const o = readOverridesFromURL();
  if (Object.keys(o).length) {
    if (!isNaN(o.sites)) sites.value = sitesNum.value = o.sites;
    if (!isNaN(o.use)) use.value = useNum.value = o.use;
    if (!isNaN(o.tariff)) tariff.value = tariffNum.value = o.tariff;
    if (!isNaN(o.eff)) eff.value = effNum.value = o.eff;
    if (!isNaN(o.leak)) leak.value = leakNum.value = o.leak;
    if (!isNaN(o.service)) service.value = serviceNum.value = o.service;
    if (!isNaN(o.co2)) co2.value = co2Num.value = o.co2;
  }

  [
    [sites, sitesNum],
    [use, useNum],
    [tariff, tariffNum],
    [eff, effNum],
    [leak, leakNum],
    [service, serviceNum],
    [co2, co2Num],
  ].forEach(([a, b]) => bindPair(a, b));

  calc();

  document.getElementById("wsCTA").addEventListener("click", () => {
    const data = {
      sites: +sites.value,
      usePerSite: +use.value,
      tariff: +tariff.value,
      eff: +eff.value,
      leak: +leak.value,
      serviceFee: +service.value,
      co2Factor: +co2.value,
    };
    document
      .getElementById("waterscan-calculator")
      .dispatchEvent(new CustomEvent("ws:cta", { detail: data }));
    if (window.location.hash !== "#contact") {
      window.location.hash = "contact";
    }
  });
})();
