import * as React from "react";
import type { CardConfig } from "@/lib/config-schema";
import type { Template, GitHubData } from "@/lib/templates/types";
import { fmtNumber, truncate } from "@/lib/templates/utils";

function GitHubRenderer({
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
  const padding = config.advanced?.padding ?? 24;
  const radius = config.advanced?.radius ?? 6;

  const showAvatar = config.fields?.owner?.avatar !== false && !!data.avatarUrl;
  const avatarSize = 52;
  const avatarGap = 14;

  const titleSize = config.size === "hero" ? 26 : 20;
  const metaSize = 12;

  const showDescription = config.fields?.repository?.description !== false && data.description;
  const showTopics = config.fields?.repository?.topics && data.topics.length > 0;
  const showStars = config.fields?.stats?.stars !== false && data.stats.stars != null;
  const showForks = config.fields?.stats?.forks && data.stats.forks != null;

  const accent = colors.accent;
  const border = "#d0d7de";
  const headerBg = "#f6f8fa";

  const repoHeader = data.cardType === "repo" ? (
    <div
      style={{
        backgroundColor: headerBg,
        padding: "8px 12px",
        marginLeft: -padding,
        marginRight: -padding,
        marginTop: -padding,
        borderBottom: `1px solid ${border}`,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: `calc(100% + ${padding * 2}px)`,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          backgroundColor: accent,
          borderRadius: "50%",
          marginRight: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>G</span>
      </div>
      <span style={{ fontSize: metaSize, color: colors.description, fontWeight: 600 }}>
        {data.owner}
      </span>
      <span style={{ fontSize: metaSize, color: colors.description, margin: "0 4px" }}>/</span>
      <span style={{ fontSize: metaSize, color: colors.title, fontWeight: 700 }}>
        {data.displayName}
      </span>
      <div style={{ flexGrow: 1 }} />
      <span
        style={{
          fontSize: metaSize,
          color: colors.description,
          backgroundColor: colors.background,
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: "1px 8px",
        }}
      >
        Public
      </span>
    </div>
  ) : null;

  const statsRow: React.ReactNode[] = [];
  if (showStars) {
    statsRow.push(
      <div key="stars" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 4 }}>
        <svg width={12} height={12} viewBox="0 0 16 16" fill={colors.description}>
          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
        </svg>
        <span style={{ fontSize: 12, color: colors.description, fontWeight: 500 }}>{fmtNumber(data.stats.stars)}</span>
      </div>
    );
  }
  if (showForks) {
    statsRow.push(
      <div key="forks" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 4 }}>
        <svg width={12} height={12} viewBox="0 0 16 16" fill={colors.description}>
          <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
        </svg>
        <span style={{ fontSize: 12, color: colors.description, fontWeight: 500 }}>{fmtNumber(data.stats.forks)}</span>
      </div>
    );
  }
  if (data.cardType === "profile" && data.stats.followers != null) {
    statsRow.push(
      <div key="followers" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 4 }}>
        <svg width={12} height={12} viewBox="0 0 16 16" fill={colors.description}>
          <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.48.074A4.5 4.5 0 0 0 8 9.5a4.5 4.5 0 0 0-3.698-4.272.75.75 0 0 1-.074-1.482A3.5 3.5 0 0 1 2 5.5Zm8 0a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 0 1-1.48.074A4.5 4.5 0 0 0 8 9.5a4.5 4.5 0 0 0-3.698-4.272.75.75 0 0 1-.074-1.482A3.5 3.5 0 0 1 2 5.5Zm8 0a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 0 1-1.48.074A4.5 4.5 0 0 0 8 9.5a4.5 4.5 0 0 0-3.698-4.272.75.75 0 0 1-.074-1.482A3.5 3.5 0 0 1 2 5.5Z" />
        </svg>
        <span style={{ fontSize: 12, color: colors.description, fontWeight: 500 }}>
          {fmtNumber(data.stats.followers)} followers
        </span>
      </div>
    );
  }

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
        border: `1px solid ${border}`,
        borderRadius: radius,
        overflow: "hidden",
      }}
    >
      {repoHeader}

      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between", marginTop: data.cardType === "repo" ? 12 : 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start" }}>
            {showAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.avatarUrl ?? ""}
                alt=""
                width={avatarSize}
                height={avatarSize}
                style={{
                  borderRadius: radius,
                  marginRight: avatarGap,
                  border: `1px solid ${border}`,
                  flexShrink: 0,
                }}
              />
            ) : null}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {data.cardType === "profile" ? (
                <>
                  <span style={{ fontSize: metaSize, color: colors.description }}>{data.owner}</span>
                  <span style={{ fontSize: titleSize, fontWeight: 700, color: colors.title, lineHeight: 1.1 }}>{data.displayName}</span>
                  <span style={{ fontSize: metaSize, color: colors.description }}>@{data.owner}</span>
                </>
              ) : (
                <span style={{ fontSize: titleSize, fontWeight: 700, color: colors.title, lineHeight: 1.1 }}>{data.displayName}</span>
              )}
            </div>
          </div>

          {showDescription ? (
            <span style={{ fontSize: metaSize, color: colors.description, lineHeight: 1.5 }}>
              {truncate(data.description, 100)}
            </span>
          ) : null}

          {showTopics ? (
            <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
              {data.topics.slice(0, 5).map((t, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    color: accent,
                    backgroundColor: `${accent}15`,
                    padding: "1px 6px",
                    borderRadius: 20,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {statsRow.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 }}>
            {statsRow.map((stat, i) => (
              <React.Fragment key={i}>{stat}</React.Fragment>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const github: Template = {
  id: "github",
  name: "GitHub",
  defaults: {
    template: "github",
    colors: {
      background: "#ffffff",
      accent: "#0969da",
      title: "#1f2328",
      description: "#656d76",
    },
    advanced: {
      radius: 6,
      shadow: "none",
      glow: false,
      opacity: 1,
      padding: 24,
      alignment: "left",
      avatarPosition: "inline",
    },
  },
  controls: [
    { key: "radius", type: "slider", min: 0, max: 16, step: 2, default: 6 },
    { key: "shadow", type: "select", options: ["none", "soft", "hard"], default: "none" },
    { key: "glow", type: "toggle", default: false },
    { key: "opacity", type: "slider", min: 0.5, max: 1, step: 0.05, default: 1 },
    { key: "padding", type: "slider", min: 12, max: 40, step: 2, default: 24 },
    { key: "alignment", type: "select", options: ["left", "center"], default: "left" },
    { key: "avatarPosition", type: "select", options: ["top", "inline"], default: "inline" },
  ],
  safeArea: {
    textMaxWidth: 600 - 48,
  },
  renderer: (config, data, dimensions) =>
    React.createElement(GitHubRenderer, { config, data, dimensions }),
};