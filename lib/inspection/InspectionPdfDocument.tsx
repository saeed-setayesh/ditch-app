import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 44,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  title: { fontSize: 16, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtle: { fontSize: 9, color: "#444", marginBottom: 16 },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 6,
  },
  colSection: { width: "18%", paddingRight: 6 },
  colItem: { width: "42%", paddingRight: 6 },
  colResult: { width: "14%" },
  colSev: { width: "26%" },
  head: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#111",
    paddingBottom: 6,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    marginTop: 12,
    fontSize: 8,
    color: "#666",
    fontStyle: "italic",
  },
});

export type InspectionPdfRow = {
  sectionTitle: string;
  itemLabel: string;
  result: string;
  severity: string;
  notes: string;
};

export type InspectionPdfProps = {
  organizationName: string;
  unitNumber: string;
  vehicleType: string;
  driverLabel: string;
  kind: string;
  status: string;
  startedAt: string;
  finalizedAt: string;
  odometerLabel: string;
  locationLabel: string;
  overallSeverity: string;
  templateName: string;
  templateVersion: number;
  rows: InspectionPdfRow[];
};

export function InspectionPdfDocument(props: InspectionPdfProps) {
  const {
    organizationName,
    unitNumber,
    vehicleType,
    driverLabel,
    kind,
    status,
    startedAt,
    finalizedAt,
    odometerLabel,
    locationLabel,
    overallSeverity,
    templateName,
    templateVersion,
    rows,
  } = props;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Vehicle inspection report</Text>
        <Text style={styles.subtle}>
          {organizationName} · Draft/finalized records are stored in the fleet portal.
          Customize checklist content with legal review before relying on it for compliance.
        </Text>

        <Text style={{ marginBottom: 8 }}>
          Unit: {unitNumber} ({vehicleType}) · Driver: {driverLabel} ·{" "}
          {kind.replace("_", "-")}
        </Text>
        <Text style={{ marginBottom: 8 }}>
          Template: {templateName} (v{templateVersion}) · Status: {status}
          {overallSeverity ? ` · Overall: ${overallSeverity}` : ""}
        </Text>
        <Text style={{ marginBottom: 8 }}>
          Started: {startedAt}
          {finalizedAt ? ` · Finalized: ${finalizedAt}` : ""}
        </Text>
        <Text style={{ marginBottom: 16 }}>
          Odometer: {odometerLabel} · Location/GPS: {locationLabel}
        </Text>

        <View style={styles.head}>
          <Text style={styles.colSection}>Section</Text>
          <Text style={styles.colItem}>Item</Text>
          <Text style={styles.colResult}>Result</Text>
          <Text style={styles.colSev}>Severity / notes</Text>
        </View>
        {rows.map((r, i) => (
          <View key={i} style={styles.row} wrap={false}>
            <Text style={styles.colSection}>{r.sectionTitle}</Text>
            <Text style={styles.colItem}>{r.itemLabel}</Text>
            <Text style={styles.colResult}>{r.result}</Text>
            <Text style={styles.colSev}>
              {r.severity}
              {r.notes ? ` · ${r.notes}` : ""}
            </Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Photos and signature files are retained electronically in the platform; this PDF summarizes item results only.
        </Text>
      </Page>
    </Document>
  );
}
