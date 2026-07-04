import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { SessionSummary } from "@/lib/sessionSummary";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#171717" },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#555", marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 3,
  },
  row: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  headerRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: "#333" },
  cell: { flex: 1 },
  cellWide: { flex: 2 },
  headerCell: { flex: 1, fontWeight: 700 },
  headerCellWide: { flex: 2, fontWeight: 700 },
  emptyText: { color: "#888", fontStyle: "italic" },
});

function formatTimestamp(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SessionSummaryDocument({
  summary,
  sessionLabel,
}: {
  summary: SessionSummary;
  sessionLabel: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>BuHaominton &mdash; Session Summary</Text>
        <Text style={styles.subtitle}>
          {`${sessionLabel} · ${summary.sessionDurationMinutes} minutes · ${summary.games.length} game${summary.games.length === 1 ? "" : "s"} played`}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Games Played</Text>
          {summary.games.length === 0 ? (
            <Text style={styles.emptyText}>No games were finished this session.</Text>
          ) : (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.headerCell}>Time</Text>
                <Text style={styles.headerCell}>Court</Text>
                <Text style={styles.headerCellWide}>Team A</Text>
                <Text style={styles.headerCellWide}>Team B</Text>
                <Text style={styles.headerCell}>Shuttles</Text>
              </View>
              {summary.games.map((g, i) => (
                <View style={styles.row} key={i} wrap={false}>
                  <Text style={styles.cell}>{formatTimestamp(g.startedAt)}</Text>
                  <Text style={styles.cell}>{g.courtLabel}</Text>
                  <Text style={styles.cellWide}>{g.teamNames[0].join(" & ")}</Text>
                  <Text style={styles.cellWide}>{g.teamNames[1].join(" & ")}</Text>
                  <Text style={styles.cell}>{g.shuttlecocksUsed ?? "–"}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {`Games Played Per Player · Total shuttlecocks used: ${summary.totalShuttlecocks}`}
          </Text>
          <View style={styles.headerRow}>
            <Text style={styles.headerCellWide}>Player</Text>
            <Text style={styles.headerCell}>Games</Text>
          </View>
          {summary.gamesPerPlayer.map((p) => (
            <View style={styles.row} key={p.name} wrap={false}>
              <Text style={styles.cellWide}>{p.name}</Text>
              <Text style={styles.cell}>{p.gamesPlayed}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most-Repeated Pairing</Text>
          {summary.mostRepeatedPairings.length === 0 ? (
            <Text style={styles.emptyText}>No repeat pairings yet.</Text>
          ) : (
            summary.mostRepeatedPairings.map((p, i) => (
              <Text key={i}>
                {`${p.playerAName} & ${p.playerBName} — met ${p.count} time${p.count === 1 ? "" : "s"}`}
              </Text>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fewest Games Played (Fairness Check)</Text>
          {summary.fewestGamesPlayers.length === 0 ? (
            <Text style={styles.emptyText}>No attendees recorded.</Text>
          ) : (
            <Text>
              {`${summary.fewestGamesPlayers.map((p) => p.name).join(", ")} — ${summary.fewestGamesPlayers[0].gamesPlayed} game${summary.fewestGamesPlayers[0].gamesPlayed === 1 ? "" : "s"} each`}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requested Matches Never Honored</Text>
          {summary.unhonoredRequests.length === 0 ? (
            <Text style={styles.emptyText}>None &mdash; every request was honored or cancelled.</Text>
          ) : (
            summary.unhonoredRequests.map((r, i) => (
              <Text key={i}>
                {r.fromName} wanted to play {r.kind} {r.targetName}
              </Text>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Per-Court Activity</Text>
          <View style={styles.headerRow}>
            <Text style={styles.headerCellWide}>Court</Text>
            <Text style={styles.headerCell}>Games</Text>
            <Text style={styles.headerCell}>Total played</Text>
          </View>
          {summary.courtActivity.map((c) => (
            <View style={styles.row} key={c.courtLabel} wrap={false}>
              <Text style={styles.cellWide}>{c.courtLabel}</Text>
              <Text style={styles.cell}>{c.gamesPlayed}</Text>
              <Text style={styles.cell}>{c.totalPlayedMinutes}m</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Duration</Text>
          {summary.gameDuration === null ? (
            <Text style={styles.emptyText}>No games finished this session.</Text>
          ) : (
            <Text>
              Average {summary.gameDuration.averageMinutes}m &middot; Longest{" "}
              {summary.gameDuration.longestMinutes}m &middot; Shortest{" "}
              {summary.gameDuration.shortestMinutes}m
            </Text>
          )}
        </View>

        {summary.costSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cost Summary</Text>
            <View style={styles.row}>
              <Text style={styles.cellWide}>Court cost</Text>
              <Text style={styles.cell}>{summary.costSummary.courtCost.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellWide}>Shuttlecock cost</Text>
              <Text style={styles.cell}>{summary.costSummary.shuttlecockCost.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellWide}>Total</Text>
              <Text style={styles.cell}>{summary.costSummary.totalCost.toFixed(2)}</Text>
            </View>
            <Text style={{ marginTop: 6 }}>
              {summary.costSummary.perPersonShare === null
                ? "No attendees recorded — can't split a per-person share."
                : `Split evenly across ${summary.costSummary.attendeeCount} attendee${summary.costSummary.attendeeCount === 1 ? "" : "s"} — ${summary.costSummary.perPersonShare.toFixed(2)} per person.`}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
