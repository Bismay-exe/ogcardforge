import * as React from "react";
import type { CardConfig } from "@/lib/config-schema";
import type { Template, GitHubData } from "@/lib/templates/types";
import { fmtNumber, truncate } from "@/lib/templates/utils";

function MinimalRenderer({
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
  const padding = config.advanced?.padding ?? 32;
  const alignment = config.advanced?.alignment ?? "left";

  const showAvatar = config.fields?.owner?.avatar !== false && !!data.avatarUrl;
  const avatarSize = 48;
  const avatarGap = 14;

  const titleSize = config.size === "hero" ? 26 : 20;
  const subSize = 13;

  const showDescription = config.fields?.repository?.description !== false && data.description;
  const showTopics = config.fields?.repository?.topics && data.topics.length > 0;
  const showStars = config.fields?.stats?.stars !== false && data.stats.stars != null;
  const showForks = config.fields?.stats?.forks && data.stats.forks != null;
  const showLicense = config.fields?.metadata?.license && data.metadata.license;

  const isCenter = alignment === "center";
  const textAlign: "left" | "center" = isCenter ? "center" : "left";
  const alignItems: "center" | "flex-start" = isCenter ? "center" : "flex-start";

  const accent = colors.accent;
  const borderColor = `${accent}40`;

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        padding,
        backgroundColor: colors.background,
        fontFamily: "Inter",
        color: colors.title,
        borderBottom: `3px solid ${accent}`,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: accent,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
          alignItems,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            {showAvatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.avatarUrl ?? ""}
                alt=""
                width={avatarSize}
                height={avatarSize}
                style={{
                  borderRadius: 4,
                  marginRight: avatarGap,
                  border: `1px solid ${borderColor}`,
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: titleSize, fontWeight: 700, color: colors.title, lineHeight: 1.1 }}>
                {data.cardType === "profile" ? `@${data.owner}` : data.displayName}
              </div>
              {data.cardType === "profile" && data.displayName !== data.owner && (
                <div style={{ fontSize: subSize, color: colors.description, marginTop: 2 }}>
                  {truncate(data.displayName, 40)}
                </div>
              )}
              {data.cardType === "repo" && data.description && (
                <div style={{ fontSize: subSize, color: colors.description, marginTop: 2 }}>
                  {truncate(data.description, 60)}
                </div>
              )}
            </div>
          </div>

          {showDescription && data.cardType === "profile" && (
            <div style={{ fontSize: subSize, color: colors.description, lineHeight: 1.5, textAlign }}>
              {truncate(data.description, 90)}
            </div>
          )}

          {showTopics && (
            <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
              {data.topics.slice(0, 4).map((t, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    color: accent,
                    textDecoration: "none",
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 16 }}>
          {showStars && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 14, color: accent }}>\u2605</span>
              <span style={{ fontSize: 13, color: colors.title, fontWeight: 600 }}>{fmtNumber(data.stats.stars)}</span>
            </div>
          )}
          {showForks && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 14, color: colors.description }}>\u221E</span>
              <span style={{ fontSize: 13, color: colors.title, fontWeight: 600 }}>{fmtNumber(data.stats.forks)}</span>
            </div>
          )}
          {showLicense && (
            <span style={{ fontSize: 11, color: colors.description }}>{data.metadata.license}</span>
          )}
          {data.cardType === "profile" && data.stats.followers != null && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 13, color: colors.description }}>{fmtNumber(data.stats.followers)} followers</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const minimal: Template = {
  id: "minimal",
  name: "Minimal",
  defaults: {
    template: "minimal",
    colors: {
      background: "#ffffff",
      accent: "#2563eb",
      title: "#0f172a",
      description: "#64748b",
    },
    advanced: {
      radius: 0,
      shadow: "none",
      glow: false,
      opacity: 1,
      padding: 32,
      alignment: "left",
      avatarPosition: "inline",
    },
  },
  controls: [
    { key: "radius", type: "slider", min: 0, max: 24, step: 2, default: 0 },
    { key: "shadow", type: "select", options: ["none", "soft", "hard"], default: "none" },
    { key: "glow", type: "toggle", default: false },
    { key: "opacity", type: "slider", min: 0.5, max: 1, step: 0.05, default: 1 },
    { key: "padding", type: "slider", min: 16, max: 48, step: 2, default: 32 },
    { key: "alignment", type: "select", options: ["left", "center"], default: "left" },
    { key: "avatarPosition", type: "select", options: ["top", "inline"], default: "inline" },
  ],
  safeArea: {
    textMaxWidth: 600 - 64,
  },
  renderer: (config, data, dimensions) =>
    React.createElement(MinimalRenderer, { config, data, dimensions }),
};