import * as React from "react";
import type { CardConfig } from "@/lib/config-schema";
import type { Template, GitHubData } from "@/lib/templates/types";
import { fmtNumber, truncate } from "@/lib/templates/utils";

function TerminalRenderer({
  config,
  data,
  dimensions,
}: {
  config: CardConfig;
  data: GitHubData;
  dimensions: { width: number; height: number };
}) {
  const { width, height } = dimensions;
  const colors = config.colors;
  const padding = config.advanced?.padding ?? 20;
  const radius = config.advanced?.radius ?? 8;

  const showAvatar = config.fields?.owner?.avatar !== false && !!data.avatarUrl;
  const avatarSize = 40;

  const titleSize = config.size === "hero" ? 22 : 18;
  const monoSize = 13;
  const labelSize = 11;

  const showDescription = config.fields?.repository?.description !== false && data.description;
  const showStars = config.fields?.stats?.stars !== false && data.stats.stars != null;
  const showForks = config.fields?.stats?.forks && data.stats.forks != null;
  const showLicense = config.fields?.metadata?.license && data.metadata.license;

  const accent = colors.accent;
  const dim = colors.description;

  const prompt = (
    <span style={{ color: accent }}>{">"}</span>
  );

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        padding,
        backgroundColor: colors.background,
        fontFamily: "monospace",
        color: colors.title,
        borderRadius: radius,
        border: `1px solid ${accent}40`,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
          borderBottom: `1px solid ${accent}25`,
          paddingBottom: 8,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", gap: 6, marginRight: 16 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ff5f56" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ffbd2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#27c93f" }} />
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: labelSize,
            color: dim,
          }}
        >
          {data.cardType === "profile" ? `~/${data.owner}` : `~/${data.owner}/${data.displayName}`}
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            {prompt}
            <span style={{ fontSize: labelSize, color: dim, marginRight: 8 }}>name</span>
            <span style={{ fontSize: titleSize, color: colors.title, fontWeight: 700 }}>
              {data.cardType === "profile" ? `@${data.owner}` : data.displayName}
            </span>
          </div>

          {data.cardType === "profile" && data.displayName !== data.owner && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              {prompt}
              <span style={{ fontSize: labelSize, color: dim, marginRight: 8 }}>full</span>
              <span style={{ fontSize: monoSize, color: colors.description }}>
                {truncate(data.displayName, 40)}
              </span>
            </div>
          )}

          {showDescription && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start" }}>
              {prompt}
              <span style={{ fontSize: labelSize, color: dim, marginRight: 8, flexShrink: 0 }}>desc</span>
              <span style={{ fontSize: monoSize, color: colors.description, lineHeight: 1.4 }}>
                {truncate(data.description, 80)}
              </span>
            </div>
          )}

          {showAvatar && data.cardType === "profile" && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              {prompt}
              <span style={{ fontSize: labelSize, color: dim, marginRight: 8 }}>avatar</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.avatarUrl ?? ""}
                alt=""
                width={avatarSize}
                height={avatarSize}
                style={{ borderRadius: 4 }}
              />
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 20, marginTop: 8 }}>
          {showStars && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: labelSize, color: dim }}>stars</span>
              <span style={{ fontSize: monoSize, color: accent, fontWeight: 700 }}>{fmtNumber(data.stats.stars)}</span>
            </div>
          )}
          {showForks && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: labelSize, color: dim }}>forks</span>
              <span style={{ fontSize: monoSize, color: accent, fontWeight: 700 }}>{fmtNumber(data.stats.forks)}</span>
            </div>
          )}
          {showLicense && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: labelSize, color: dim }}>license</span>
              <span style={{ fontSize: monoSize, color: colors.description }}>{data.metadata.license}</span>
            </div>
          )}
          {data.cardType === "profile" && data.stats.followers != null && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: labelSize, color: dim }}>followers</span>
              <span style={{ fontSize: monoSize, color: accent, fontWeight: 700 }}>{fmtNumber(data.stats.followers)}</span>
            </div>
          )}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: labelSize, color: `${accent}80` }}>og-card</span>
        </div>
      </div>
    </div>
  );
}

export const terminal: Template = {
  id: "terminal",
  name: "Terminal",
  defaults: {
    template: "terminal",
    colors: {
      background: "#0d1117",
      accent: "#3fb950",
      title: "#e6edf3",
      description: "#7d8590",
    },
    advanced: {
      radius: 8,
      shadow: "none",
      glow: false,
      opacity: 1,
      padding: 20,
      alignment: "left",
      avatarPosition: "inline",
    },
  },
  controls: [
    { key: "radius", type: "slider", min: 0, max: 16, step: 2, default: 8 },
    { key: "shadow", type: "select", options: ["none", "soft", "hard"], default: "none" },
    { key: "glow", type: "toggle", default: false },
    { key: "opacity", type: "slider", min: 0.5, max: 1, step: 0.05, default: 1 },
    { key: "padding", type: "slider", min: 12, max: 40, step: 2, default: 20 },
    { key: "alignment", type: "select", options: ["left", "center"], default: "left" },
    { key: "avatarPosition", type: "select", options: ["top", "inline"], default: "inline" },
  ],
  safeArea: {
    textMaxWidth: 600 - 40,
  },
  renderer: (config, data, dimensions) =>
    React.createElement(TerminalRenderer, { config, data, dimensions }),
};