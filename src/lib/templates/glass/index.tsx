import * as React from "react";
import type { CardConfig } from "@/lib/config-schema";
import type { Template, GitHubData } from "@/lib/templates/types";
import { fmtNumber, truncate } from "@/lib/templates/utils";

function GlassRenderer({
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
  const radius = config.advanced?.radius ?? 20;
  const padding = config.advanced?.padding ?? 24;
  const glow = config.advanced?.glow ?? false;
  const opacity = config.advanced?.opacity ?? 0.85;

  const showAvatar = config.fields?.owner?.avatar !== false && !!data.avatarUrl;
  const avatarSize = 56;
  const avatarGap = 14;

  const titleSize = config.size === "hero" ? 28 : 22;
  const subSize = 13;

  const showDescription = config.fields?.repository?.description !== false && data.description;
  const showTopics = config.fields?.repository?.topics && data.topics.length > 0;
  const showStars = config.fields?.stats?.stars !== false && data.stats.stars != null;
  const showForks = config.fields?.stats?.forks && data.stats.forks != null;
  const showLicense = config.fields?.metadata?.license && data.metadata.license;

  const glassBg = `rgba(255,255,255,${opacity * 0.12})`;
  const glassBorder = `rgba(255,255,255,${opacity * 0.25})`;

  const accentColor = colors.accent;

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        padding,
        backgroundColor: "#0a0a1a",
        borderRadius: radius,
        fontFamily: "Inter",
        color: colors.title,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {glow && (
        <div
          style={{
            position: "absolute",
            top: -height * 0.3,
            left: width * 0.1,
            width: width * 0.8,
            height: height * 0.7,
            background: `radial-gradient(ellipse, ${accentColor}60 0%, transparent 70%)`,
            display: "flex",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: glassBg,
          border: `1px solid ${glassBorder}`,
          borderRadius: radius,
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            {showAvatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.avatarUrl ?? ""}
                alt=""
                width={avatarSize}
                height={avatarSize}
                style={{
                  borderRadius: avatarSize / 2,
                  marginRight: avatarGap,
                  border: `2px solid ${accentColor}80`,
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
            </div>
          </div>

          {showDescription && (
            <div style={{ fontSize: subSize, color: colors.description, lineHeight: 1.5, marginTop: 2 }}>
              {truncate(data.description, 90)}
            </div>
          )}

          {showTopics && (
            <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {data.topics.slice(0, 3).map((t, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    color: accentColor,
                    backgroundColor: `${accentColor}18`,
                    padding: "2px 8px",
                    borderRadius: 4,
                    border: `1px solid ${accentColor}30`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 }}>
          {showStars && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: accentColor, marginRight: 4 }}>\u2605</span>
              <span style={{ fontSize: 13, color: colors.title, fontWeight: 600 }}>{fmtNumber(data.stats.stars)}</span>
            </div>
          )}
          {showForks && (
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: colors.description, marginRight: 4 }}>\u221E</span>
              <span style={{ fontSize: 13, color: colors.title, fontWeight: 600 }}>{fmtNumber(data.stats.forks)}</span>
            </div>
          )}
          {showLicense && (
            <span style={{ fontSize: 11, color: colors.description }}>
              {data.metadata.license}
            </span>
          )}
          <div style={{ flex: 1 }} />
          <div
            style={{
              fontSize: 11,
              color: `${accentColor}90`,
              backgroundColor: `${accentColor}15`,
              padding: "3px 10px",
              borderRadius: 20,
              border: `1px solid ${accentColor}30`,
            }}
          >
            {data.cardType === "profile" ? "profile" : "repository"}
          </div>
        </div>
      </div>
    </div>
  );
}

export const glass: Template = {
  id: "glass",
  name: "Glass",
  defaults: {
    template: "glass",
    colors: {
      background: "#0a0a1a",
      accent: "#a78bfa",
      title: "#f8fafc",
      description: "#94a3b8",
    },
    advanced: {
      radius: 20,
      shadow: "soft",
      glow: true,
      opacity: 0.85,
      padding: 24,
      alignment: "left",
      avatarPosition: "inline",
    },
  },
  controls: [
    { key: "radius", type: "slider", min: 0, max: 32, step: 2, default: 20 },
    { key: "shadow", type: "select", options: ["none", "soft", "hard"], default: "soft" },
    { key: "glow", type: "toggle", default: true },
    { key: "opacity", type: "slider", min: 0.4, max: 1, step: 0.05, default: 0.85 },
    { key: "padding", type: "slider", min: 16, max: 48, step: 2, default: 24 },
    { key: "alignment", type: "select", options: ["left", "center"], default: "left" },
    { key: "avatarPosition", type: "select", options: ["top", "inline"], default: "inline" },
  ],
  safeArea: {
    textMaxWidth: 600 - 48,
  },
  renderer: (config, data, dimensions) =>
    React.createElement(GlassRenderer, { config, data, dimensions }),
};