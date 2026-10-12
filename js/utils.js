// Shared state and helpers.
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const state = {
  blocks: [],
  source: "",
  type: "all",
  sort: "name",
  group: "none",
  roOnly: false,
  namedOnly: false,
  removableOnly: false,
  selected: new Set(),
  flashImgs: {},
};

const api = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
};

const message = (text, error = false) => {
  $("#message").innerHTML = `<div class="notice ${error ? "error" : "success"}">${error ? "ERROR / " : "OK / "}${text}</div>`;
  if (!error) setTimeout(() => { $("#message").innerHTML = ""; }, 5000);
};

const setRefreshing = loading => {
  const btn = $("#refreshBtn");
  if (!btn) return;
  btn.disabled = loading;
  btn.querySelector(".button-label")?.classList.toggle("hidden", loading);
  btn.querySelector(".spinner")?.classList.toggle("hidden", !loading);
};

const setProgress = (barId, pctId, done, total) => {
  const pct = total ? Math.min(100, Math.round(done / total * 100)) : 0;
  const bar = $("#" + barId);
  const pctEl = $("#" + pctId);
  if (bar) bar.style.width = pct + "%";
  if (pctEl) pctEl.textContent = pct + "%";
};

const showProgress = (wrapId, show) => {
  const el = $("#" + wrapId);
  if (!el) return;
  el.classList.toggle("hidden", !show);
  const barId = wrapId === "exProg" ? "exBar" : "flBar";
  const pctId = wrapId === "exProg" ? "exPct" : "flPct";
  if (show) {
    setProgress(barId, pctId, 0, 1);
  } else {
    setTimeout(() => {
      setProgress(barId, pctId, 0, 1);
    }, 300);
  }
};
