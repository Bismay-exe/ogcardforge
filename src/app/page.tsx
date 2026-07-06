"use client";

import { useState, useReducer, useEffect, useMemo, useRef, startTransition } from "react";
import { Download, Upload, Check, AlertCircle } from "lucide-react";
import { configToQueryParams, validateConfig, configToJSON, jsonToConfig, type CardConfig, type Size } from "@/lib/config-schema";
import { registry } from "@/lib/templates/registry";
import { presets } from "@/lib/presets";
import { emptyGithubData } from "@/lib/templates/github-data";
import type { GitHubData, ControlSchema } from "@/lib/templates/types";
import type { Template } from "@/lib/templates/types";

type BuilderAction =
  | { type: "SET_CARD_TYPE"; value: "repo" | "profile" }
  | { type: "SET_TEMPLATE"; template: Template }
  | { type: "SET_OWNER"; value: string }
  | { type: "SET_REPO"; value: string }
  | { type: "SET_COLOR_BG"; value: string }
  | { type: "SET_COLOR_ACCENT"; value: string }
  | { type: "SET_COLOR_TITLE"; value: string }
  | { type: "SET_COLOR_DESC"; value: string }
  | { type: "SET_SIZE"; value: Size }
  | { type: "SET_GITHUB_DATA"; data: GitHubData | null }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_REPO_LIST"; list: Array<{ name: string; description: string | null }> }
  | { type: "RESET_TO_TEMPLATE_DEFAULTS"; template: Template; cardType: "repo" | "profile" }
  | { type: "SET_ADVANCED"; key: string; value: unknown }
  | { type: "SET_FIELD"; group: "repository" | "owner" | "stats" | "metadata"; field: string; value: boolean }
  | { type: "SET_VIEW_MODE"; value: "ui" | "advanced" | "json" }
  | { type: "SET_JSON_TEXT"; value: string }
  | { type: "SET_JSON_ERROR"; value: string | null }
  | { type: "APPLY_JSON"; json: string }
  | { type: "APPLY_PRESET"; preset: { template: string; colors: { background: string; accent: string; title: string; description: string }; advanced?: Record<string, unknown> } };

function reducer(state: { config: CardConfig; githubData: GitHubData | null; loading: boolean; repoList: Array<{ name: string; description: string | null }> }, action: BuilderAction) {
  switch (action.type) {
    case "SET_CARD_TYPE":
      return { ...state, config: { ...state.config, cardType: action.value } };
    case "SET_TEMPLATE":
      return {
        ...state,
        config: {
          ...state.config,
          template: action.template.id,
          colors: { ...action.template.defaults.colors ?? state.config.colors },
          advanced: { ...state.config.advanced, ...action.template.defaults.advanced },
        },
      };
    case "SET_OWNER":
      return { ...state, config: { ...state.config, repo: { ...state.config.repo, owner: action.value, name: state.config.repo?.name ?? "" } } };
    case "SET_REPO":
      return { ...state, config: { ...state.config, repo: { ...state.config.repo, owner: state.config.repo?.owner ?? "", name: action.value } } };
    case "SET_COLOR_BG":
      return { ...state, config: { ...state.config, colors: { ...state.config.colors, background: action.value } } };
    case "SET_COLOR_ACCENT":
      return { ...state, config: { ...state.config, colors: { ...state.config.colors, accent: action.value } } };
    case "SET_COLOR_TITLE":
      return { ...state, config: { ...state.config, colors: { ...state.config.colors, title: action.value } } };
    case "SET_COLOR_DESC":
      return { ...state, config: { ...state.config, colors: { ...state.config.colors, description: action.value } } };
    case "SET_SIZE":
      return { ...state, config: { ...state.config, size: action.value } };
    case "SET_GITHUB_DATA":
      return { ...state, githubData: action.data };
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_REPO_LIST":
      return { ...state, repoList: action.list };
case "RESET_TO_TEMPLATE_DEFAULTS":
      return {
        ...state,
        config: {
          ...state.config,
          template: action.template.id,
          cardType: action.cardType,
          colors: { ...action.template.defaults.colors ?? state.config.colors },
          advanced: { ...state.config.advanced, ...action.template.defaults.advanced },
        },
      };
    case "SET_ADVANCED":
      return {
        ...state,
        config: {
          ...state.config,
          advanced: { ...state.config.advanced, [action.key]: action.value },
        },
      };
    case "SET_FIELD":
      return {
        ...state,
        config: {
          ...state.config,
          fields: {
            ...state.config.fields,
            [action.group]: {
              ...state.config.fields?.[action.group],
              [action.field]: action.value,
            },
          },
        },
      };
    case "SET_VIEW_MODE":
    case "SET_JSON_TEXT":
    case "SET_JSON_ERROR":
      return state;
    case "APPLY_JSON":
      try {
        const parsed = jsonToConfig(action.json);
        return { ...state, config: parsed };
      } catch {
        return state;
      }
    case "APPLY_PRESET": {
      const { preset } = action;
      return {
        ...state,
        config: {
          ...state.config,
          template: preset.template,
          colors: { ...preset.colors },
          advanced: { ...state.config.advanced, ...preset.advanced },
        },
      };
    }
    default:
      return state;
  }
}

function getCardEndpoint(cardType: "repo" | "profile"): string {
  return cardType === "profile" ? "/api/v1/profile" : "/api/v1/repo";
}

function fetchRepoList(owner: string, signal: AbortSignal) {
  return fetch(`/api/v1/repos?owner=${encodeURIComponent(owner)}`, { signal })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (d?.repos as Array<{ name: string; description: string | null }> | undefined) ?? [])
    .catch(() => []);
}

function fetchGitHubData(cardType: "repo" | "profile", owner: string, repo?: string) {
  if (cardType === "profile") {
    return fetch(`/api/v1/profile?username=${encodeURIComponent(owner)}&debug=json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.githubData as GitHubData | undefined)
      .catch(() => null);
  }
  if (repo) {
    return fetch(`/api/v1/repo?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&debug=json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.githubData as GitHubData | undefined)
      .catch(() => null);
  }
  return fetch(`/api/v1/profile?username=${encodeURIComponent(owner)}&debug=json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => d?.githubData as GitHubData | undefined)
    .catch(() => null);
}

function fetchPreview(config: CardConfig, githubData: GitHubData) {
  return fetch("/api/v1/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config, githubData }),
  })
    .then((r) => (r.ok ? r.text() : null))
    .catch(() => null);
}

const templates = registry.list();

const initialTemplate = templates.find((t) => t.id === "modern") ?? templates[0];
const _initialValidation = validateConfig({
  ...initialTemplate.defaults,
  template: initialTemplate.id,
  cardType: "repo",
  size: "standard",
  font: "Inter",
  repo: { owner: "vercel", name: "next.js" },
});
if (!_initialValidation.success) {
  throw new Error("Failed to validate initial builder config: " + JSON.stringify(_initialValidation.errors));
}
const initialConfig: CardConfig = _initialValidation.config;

export default function BuilderPage() {
  const [state, dispatch] = useReducer(reducer, {
    config: initialConfig,
    githubData: null,
    loading: false,
    repoList: [],
  });

  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [repoFilter, setRepoFilter] = useState("");
  const [viewMode, setViewMode] = useState<"ui" | "advanced" | "json">("ui");
  const [jsonText, setJsonText] = useState(() => configToJSON(initialConfig));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const { config, githubData, loading, repoList } = state;
  const cardType = config.cardType ?? "repo";
  const activeTemplate = templates.find((t) => t.id === config.template) ?? initialTemplate;

  const ghData = githubData ?? emptyGithubData(cardType, config.repo?.owner ?? "");

  const shareableUrl = useMemo(() => {
    const params = configToQueryParams(config);
    const endpoint = getCardEndpoint(cardType);
    const origin = typeof window !== "undefined"
      ? window.location.origin
      : "https://og-card.vercel.app";
    return `${origin}${endpoint}?${params.toString()}`;
  }, [config, cardType]);

  useEffect(() => {
    const render = async () => {
      setPreviewError(null);
      const svg = await fetchPreview(config, ghData);
      if (svg) {
        setPreviewSvg(svg);
      } else {
        setPreviewError("Preview render failed");
      }
    };
    render();
  }, [config, ghData]);

  useEffect(() => {
    const owner = config.repo?.owner;
    if (!owner || owner.length < 2) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      fetchRepoList(owner, controller.signal).then((repos) => {
        dispatch({ type: "SET_REPO_LIST", list: repos });
      });
    }, 350);
  }, [config.repo?.owner]);

  useEffect(() => {
    const owner = config.repo?.owner;
    if (!owner || owner.length < 2) return;

    dispatch({ type: "SET_LOADING", value: true });
    const ticket = setTimeout(() => {
      fetchGitHubData(cardType, owner, config.repo?.name).then((data) => {
        if (data) dispatch({ type: "SET_GITHUB_DATA", data });
        dispatch({ type: "SET_LOADING", value: false });
      });
    }, 500);
    return () => clearTimeout(ticket);
  }, [config.repo?.owner, config.repo?.name, cardType]);

  useEffect(() => {
    startTransition(() => {
      setJsonText(configToJSON(config));
    });
  }, [config]);

  const handleCopyUrl = async () => {
    const url = shareableUrl;
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch {
      // fallback — user selects manually
    }
  };

  const handleApplyJson = () => {
    setJsonError(null);
    try {
      const parsed = jsonToConfig(jsonText);
      dispatch({ type: "APPLY_JSON", json: jsonText });
      void parsed;
    } catch (err) {
      setJsonError(String(err));
    }
  };

  const handleExport = () => {
    const json = configToJSON(config, true);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `og-card-${config.template}-${config.repo?.owner ?? "profile"}-${config.repo?.name ?? ""}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setImportStatus({ ok: true, message: "Exported config" });
    setTimeout(() => setImportStatus(null), 2000);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const parsed = jsonToConfig(text);
        dispatch({ type: "APPLY_JSON", json: text });
        setImportStatus({ ok: true, message: `Imported "${file.name}"` });
        setTimeout(() => setImportStatus(null), 2500);
        void parsed;
      } catch (err) {
        setImportStatus({ ok: false, message: `Invalid JSON: ${err instanceof Error ? err.message : String(err)}` });
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.onerror = () => {
      setImportStatus({ ok: false, message: "Failed to read file" });
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filteredRepos = repoList.filter((r) =>
    r.name.toLowerCase().includes(repoFilter.toLowerCase())
  );

  const selectedRepoFromList = repoList.find((r) => r.name === config.repo?.name);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
          <span className="text-sm font-semibold tracking-tight">OG Card Builder</span>
          <div className="flex items-center gap-2">
            {importStatus && (
              <span
                role="status"
                aria-live="polite"
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                  importStatus.ok
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                }`}
              >
                {importStatus.ok ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {importStatus.message}
              </span>
            )}
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportChange}
              className="hidden"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={handleImportClick}
              className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              title="Import config from .json file"
            >
              <Upload className="h-3.5 w-3.5" />
              Import
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-md border border-zinc-900 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-100 transition hover:bg-zinc-700 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              title="Export current config as .json file"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <span className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              v0.2
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-8 lg:flex-row">
        {/* ── Controls Panel ── */}
        <div className="flex w-full flex-col gap-5 lg:w-[420px] lg:flex-shrink-0">
          {/* View Mode Toggle */}
          <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {(["ui", "advanced", "json"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  viewMode === mode
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {mode === "ui" ? "Simple" : mode}
              </button>
            ))}
          </div>

          {/* Section: Card Type */}
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Card Type</h2>
            <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
              {(["repo", "profile"] as const).map((ct) => (
                <button
                  key={ct}
                  onClick={() => dispatch({ type: "SET_CARD_TYPE", value: ct })}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    cardType === ct
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  {ct === "repo" ? "Repository" : "Profile"}
                </button>
              ))}
            </div>
          </section>

          {/* Section: GitHub Input */}
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {cardType === "profile" ? "Username" : "Owner & Repo"}
            </h2>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder={cardType === "profile" ? "username (e.g. torvalds)" : "owner (e.g. vercel)"}
                  value={config.repo?.owner ?? ""}
                  onChange={(e) => dispatch({ type: "SET_OWNER", value: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                />
                {loading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                    \u2026
                  </span>
                )}
              </div>

              {cardType === "repo" && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="repo (e.g. next.js)"
                    value={config.repo?.name ?? ""}
                    onFocus={() => setShowRepoDropdown(true)}
                    onBlur={() => setTimeout(() => setShowRepoDropdown(false), 200)}
                    onChange={(e) => {
                      dispatch({ type: "SET_REPO", value: e.target.value });
                      setRepoFilter(e.target.value);
                      setShowRepoDropdown(true);
                    }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                  />

                  {showRepoDropdown && filteredRepos.length > 0 && (
                    <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                      {filteredRepos.slice(0, 10).map((r) => (
                        <button
                          key={r.name}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            dispatch({ type: "SET_REPO", value: r.name });
                            setShowRepoDropdown(false);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <span className="font-medium">{r.name}</span>
                          {r.description && (
                            <span className="ml-2 text-xs text-zinc-400">
                              {r.description.slice(0, 50)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedRepoFromList?.description && (
                <p className="text-xs text-zinc-400">{selectedRepoFromList.description.slice(0, 80)}</p>
              )}

              {ghData.cardType === cardType && ghData.owner !== "" && (
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
                  {ghData.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ghData.avatarUrl ?? ""}
                      alt=""
                      className="h-5 w-5 rounded-full"
                    />
                  )}
                  <span className="font-medium">{ghData.displayName}</span>
                  {ghData.stats.stars != null && <span>\u2605 {ghData.stats.stars}</span>}
                </div>
              )}
            </div>
          </section>

          {/* Section: Presets */}
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Presets</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => dispatch({ type: "APPLY_PRESET", preset })}
                  className="group flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-2.5 text-left transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500"
                >
                  {/* Color preview bars */}
                  <div className="flex h-8 gap-0.5 overflow-hidden rounded-md">
                    <div className="flex-1" style={{ backgroundColor: preset.colors.background }} />
                    <div className="flex-1" style={{ backgroundColor: preset.colors.accent }} />
                    <div className="flex-1" style={{ backgroundColor: preset.colors.title }} />
                    <div className="flex-1" style={{ backgroundColor: preset.colors.description }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{preset.name}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      preset.tag === "dark" ? "bg-zinc-900 text-zinc-200"
                        : preset.tag === "light" ? "bg-zinc-100 text-zinc-600"
                          : "bg-violet-100 text-violet-700"
                    }`}>
                      {preset.tag}
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug text-zinc-400">{preset.description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Section: Template */}
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Template</h2>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
              {templates.map((t) => {
                const c = t.defaults.colors ?? { background: "#fff", accent: "#000", title: "#fff", description: "#fff" };
                const active = t.id === config.template;
                return (
                  <button
                    key={t.id}
                    onClick={() => dispatch({ type: "SET_TEMPLATE", template: t })}
                    className={`flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors ${
                      active
                        ? "border-zinc-900 bg-zinc-900 text-zinc-100 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500"
                    }`}
                  >
                    <div className="flex gap-1">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.background }} />
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.accent }} />
                    </div>
                    <span className={`text-xs font-semibold ${active ? "text-zinc-100 dark:text-zinc-900" : "text-zinc-700 dark:text-zinc-300"}`}>
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section: Colors */}
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Colors</h2>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "SET_COLOR_BG", label: "Background", val: config.colors.background },
                { key: "SET_COLOR_ACCENT", label: "Accent", val: config.colors.accent },
                { key: "SET_COLOR_TITLE", label: "Title", val: config.colors.title },
                { key: "SET_COLOR_DESC", label: "Description", val: config.colors.description },
              ] as const).map((c) => (
                <div key={c.key} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800">
                  <input
                    type="color"
                    value={c.val}
                    onChange={(e) => dispatch({ type: c.key, value: e.target.value })}
                    className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="flex-1 text-xs font-medium text-zinc-500">{c.label}</span>
                  <span className="text-[11px] font-mono text-zinc-400">{c.val}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Size */}
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Size</h2>
            <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
              {(["compact", "standard", "hero"] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => dispatch({ type: "SET_SIZE", value: sz })}
                  className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    config.size === sz
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </section>
        {viewMode !== "json" && (
          <>
            <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Template Controls</h2>
              <div className="flex flex-col gap-3">
                {(activeTemplate.controls as ControlSchema[]).map((ctrl: ControlSchema) => {
                  if (ctrl.type === "slider") {
                    const val = (config.advanced?.[ctrl.key] as number) ?? ctrl.default;
                    return (
                      <div key={ctrl.key} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium capitalize text-zinc-600 dark:text-zinc-300">{ctrl.key}</label>
                          <span className="text-[11px] font-mono text-zinc-400">{val}</span>
                        </div>
                        <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step} value={val} onChange={(e) => dispatch({ type: "SET_ADVANCED", key: ctrl.key, value: Number(e.target.value) })} className="w-full accent-zinc-900" />
                      </div>
                    );
                  }
                  if (ctrl.type === "select") {
                    const val = (config.advanced?.[ctrl.key] as string) ?? ctrl.default;
                    return (
                      <div key={ctrl.key} className="flex flex-col gap-1">
                        <label className="text-xs font-medium capitalize text-zinc-600 dark:text-zinc-300">{ctrl.key}</label>
                        <select value={val} onChange={(e) => dispatch({ type: "SET_ADVANCED", key: ctrl.key, value: e.target.value })} className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900">
                          {ctrl.options.map((opt) => <option key={String(opt)} value={String(opt)}>{opt}</option>)}
                        </select>
                      </div>
                    );
                  }
                  if (ctrl.type === "toggle") {
                    const val = !!config.advanced?.[ctrl.key];
                    return (
                      <div key={ctrl.key} className="flex items-center justify-between">
                        <label className="text-xs font-medium capitalize text-zinc-600 dark:text-zinc-300">{ctrl.key}</label>
                        <button role="switch" aria-checked={val} onClick={() => dispatch({ type: "SET_ADVANCED", key: ctrl.key, value: !val })} className={`relative h-5 w-9 rounded-full transition-colors ${val ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-600"}`}>
                          <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${val ? "translate-x-4" : ""}`} />
                        </button>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Shown Fields</h2>
              <div className="flex flex-col gap-3">
                {(["repository", "owner", "stats", "metadata"] as const).map((group) => {
                  const groupFields = config.fields?.[group] ?? {};
                  const fieldEntries = Object.entries(groupFields);
                  if (fieldEntries.length === 0) return null;
                  return (
                    <div key={group}>
                      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{group}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {fieldEntries.map(([field, value]) => (
                          <button key={field} onClick={() => dispatch({ type: "SET_FIELD", group, field, value: !value })} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${value ? "border-zinc-900 bg-zinc-900 text-zinc-100 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "border-zinc-300 text-zinc-400 hover:border-zinc-400"}`}>
                            {field}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {viewMode === "json" && (
          <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Card Config (JSON)</h2>
            <textarea value={jsonText} onChange={(e) => { setJsonText(e.target.value); setJsonError(null); }} onBlur={handleApplyJson} className="w-full resize-y rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-700 outline-none focus:border-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300" rows={18} spellCheck={false} />
            {jsonError && <p className="mt-1.5 text-[11px] text-red-500">Parse error: {jsonError}</p>}
            <p className="mt-2 text-[11px] text-zinc-400">Apply on blur. Changes sync back to the Simple/Advanced UI.</p>
          </section>
        )}
        </div>

        {/* ── Preview Panel ── */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Preview</h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400">{config.size} \u00b7 {config.template}</span>
            </div>
          </div>

          <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            {previewSvg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/svg+xml,${encodeURIComponent(previewSvg)}`}
                alt="Card preview"
                className="max-w-full rounded-lg shadow-md"
                style={{ maxHeight: 380 }}
              />
            ) : previewError ? (
              <div className="flex flex-col items-center gap-2 py-12 text-sm text-zinc-400">
                <span className="text-lg">\u26a0</span>
                <span>{previewError}</span>
                {!config.repo?.owner && (
                  <span className="text-xs">Enter an owner/username to generate a card</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-sm text-zinc-400">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                <span>Rendering\u2026</span>
              </div>
            )}
          </div>

          {/* Section: Share */}
          <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Embed URL</h2>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareableUrl}
                className="flex-1 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-[11px] font-mono text-zinc-600 outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
              />
              <button
                onClick={handleCopyUrl}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {urlCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-zinc-400">
              Paste this URL into any GitHub README or profile to embed the card.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}