import * as React from "react";
import type { CardConfig } from "@/lib/config-schema";
import type { Template, GitHubData } from "@/lib/templates/types";
import { fmtNumber, truncate } from "@/lib/templates/utils";

function ModernRenderer({
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
  const radius = config.advanced?.radius ?? 16;
  const padding = config.advanced?.padding ?? 24;
  const alignment = config.advanced?.alignment ?? "left";
  const glow = config.advanced?.glow ?? false;

  const safeMaxText = width - padding * 2;

  // Avatar (60x60 circle, optional)
  const showAvatar = config.fields?.owner?.avatar !== false && !!data.avatarUrl;
  const avatarSize = 60;
  const avatarGap = 16;

  // Text block layout
  const titleSize = config.size === "hero" ? 32 : 24;
  const subSize = 14;

  // Field toggles
  const showDescription = config.fields?.repository?.description !== false && data.description;
  const showTopics = config.fields?.repository?.topics && data.topics.length > 0;
  const showHomepage = config.fields?.repository?.homepage && data.homepage;
  const showStars = config.fields?.stats?.stars !== false && data.stats.stars != null;
  const showForks = config.fields?.stats?.forks && data.stats.forks != null;
  const showIssues = config.fields?.stats?.issues && data.stats.openIssues != null;
  const showLicense = config.fields?.metadata?.license && data.metadata.license;
  const showLastUpdated = config.fields?.metadata?.lastUpdated && data.metadata.lastUpdated;
  const showArchived = config.fields?.metadata?.archived && data.metadata.archived;

  const statsRow: React.ReactNode[] = [];
  if (showStars) statsRow.push(<Stat key="stars" symbol="\u2605" value={fmtNumber(data.stats.stars)} color={colors.title} />);
  if (showForks) statsRow.push(<Stat key="forks" symbol="\u2b24" value={fmtNumber(data.stats.forks)} color={colors.description} />);
  if (showIssues) statsRow.push(<Stat key="issues" symbol="\u26a0" value={fmtNumber(data.stats.openIssues)} color={colors.description} />);
  if (showLicense) statsRow.push(<Stat key="license" symbol="" value={data.metadata.license ?? ""} color={colors.description} />);
  if (showLastUpdated) statsRow.push(<Stat key="updated" symbol="" value={data.metadata.lastUpdated ?? ""} color={colors.description} />);
  if (showArchived) statsRow.push(<Stat key="archived" symbol="" value="archived" color={colors.description} />);

  // For profile cards: show followers/following/publicRepos
  const profileStats: React.ReactNode[] = [];
  if (data.cardType === "profile") {
    if (data.stats.followers != null) profileStats.push(<Stat key="followers" symbol="\u261d" value={`${fmtNumber(data.stats.followers)} followers`} color={colors.title} />);
    if (data.stats.following != null) profileStats.push(<Stat key="following" symbol="" value={`${fmtNumber(data.stats.following)} following`} color={colors.description} />);
    if (data.stats.publicRepos != null) profileStats.push(<Stat key="repos" symbol="" value={`${fmtNumber(data.stats.publicRepos)} repos`} color={colors.description} />);
  }

  const statsToRender = data.cardType === "profile" ? profileStats : statsRow;

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding,
        backgroundColor: colors.background,
        borderRadius: radius,
        fontFamily: "Inter",
        color: colors.title,
        backgroundImage: `linear-gradient(135deg, ${colors.accent}30 0%, transparent 55%)`,
        alignItems: alignment === "center" ? "center" : "flex-start",
        textAlign: alignment === "center" ? "center" : "left",
      }}
    >
      {glow && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: height * 0.4,
            backgroundImage: `linear-gradient(180deg, ${colors.title}22, transparent)`,
            borderRadius: radius,
            display: "flex",
          }}
        />
      )}

      {/* Header: avatar + title block */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
        {showAvatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.avatarUrl ?? ""}
            alt={`${data.owner} avatar`}
            width={avatarSize}
            height={avatarSize}
            style={{
              borderRadius: avatarSize / 2,
              marginRight: avatarGap,
              border: `2px solid ${colors.accent}`,
            }}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: safeMaxText - (showAvatar ? avatarSize + avatarGap : 0) }}>
          <div style={{ fontSize: titleSize, fontWeight: 700, lineHeight: 1.1, color: colors.title }}>
            {data.cardType === "profile" ? `@${data.owner}` : data.displayName}
          </div>
          {data.cardType === "profile" && data.displayName !== data.owner && (
            <div style={{ fontSize: subSize, color: colors.description, marginTop: 4 }}>
              {truncate(data.displayName, 50)}
            </div>
          )}
        </div>
      </div>

      {/* Middle: description + topics + homepage */}
      <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 12 }}>
        {showDescription && (
          <div style={{ fontSize: subSize, color: colors.description, lineHeight: 1.4, maxWidth: safeMaxText }}>
            {truncate(data.description, 110)}
          </div>
        )}
        {showTopics && (
          <div style={{ display: "flex", flexDirection: "row", marginTop: 10, maxWidth: safeMaxText, flexWrap: "wrap" }}>
            {data.topics.slice(0, 4).map((t, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  color: colors.accent,
                  backgroundColor: `${colors.accent}20`,
                  padding: "3px 8px",
                  borderRadius: 6,
                  marginRight: 6,
                  marginBottom: 4,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
        {showHomepage && (
          <div style={{ fontSize: subSize, color: colors.accent, marginTop: 8 }}>
            {data.homepage}
          </div>
        )}
      </div>

      {/* Footer: stats row */}
      {statsToRender.length > 0 && (
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%", marginTop: 8 }}>
          {statsToRender.map((stat, i) => (
            <React.Fragment key={i}>{stat}</React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ symbol, value, color }: { symbol: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginRight: 16 }}>
      {symbol && (
        <span style={{ fontSize: 14, marginRight: 4, color }}>{symbol}</span>
      )}
      <span style={{ fontSize: 13, color, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export const modern: Template = {
  id: "modern",
  name: "Modern",
  defaults: {
    template: "modern",
    colors: {
      background: "#0f172a",
      accent: "#38bdf8",
      title: "#f8fafc",
      description: "#cbd5e1",
    },
    advanced: {
      radius: 16,
      shadow: "soft",
      glow: true,
      opacity: 1,
      padding: 24,
      alignment: "left",
      avatarPosition: "inline",
    },
  },
  controls: [
    { key: "radius", type: "slider", min: 0, max: 32, step: 2, default: 16 },
    { key: "shadow", type: "select", options: ["none", "soft", "hard"], default: "soft" },
    { key: "glow", type: "toggle", default: true },
    { key: "opacity", type: "slider", min: 0, max: 1, step: 0.05, default: 1 },
    { key: "padding", type: "slider", min: 16, max: 48, step: 2, default: 24 },
    { key: "alignment", type: "select", options: ["left", "center"], default: "left" },
    { key: "avatarPosition", type: "select", options: ["top", "inline"], default: "inline" },
  ],
  safeArea: {
    textMaxWidth: 600 - 48,
  },
  renderer: (config, data, dimensions) =>
    React.createElement(ModernRenderer, { config, data, dimensions }),
};
