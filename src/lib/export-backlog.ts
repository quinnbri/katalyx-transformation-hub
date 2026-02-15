import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Action {
  id: string;
  title: string;
  effort: number;
  impact: string;
  owner: string;
  successMetric: string;
  dependencies: string[];
  aiContext: string;
  estimatedROI: {
    timeSavings: string;
    riskReduction: string;
    cost: string;
    payback: string;
  };
}

interface Sprint {
  number: number;
  timeline: string;
  priority: string;
  budget: number;
  actions: Action[];
}

interface BacklogData {
  sprints: Sprint[];
  deferredActions?: Action[];
}

/* ── Jira CSV ─────────────────────────────────────── */

export function exportToJiraCsv(data: BacklogData, companyName: string) {
  const headers = [
    "Summary",
    "Issue Type",
    "Priority",
    "Story Points",
    "Sprint",
    "Assignee",
    "Description",
    "Labels",
    "Linked Issues",
  ];

  const priorityMap: Record<string, string> = {
    CRITICAL: "Highest",
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
  };

  const rows = data.sprints.flatMap((sprint) =>
    sprint.actions.map((action) => {
      const storyPoints = Math.max(1, Math.round(action.effort / 8));
      const deps = action.dependencies
        .map((d) => `is blocked by ${d}`)
        .join("; ");
      const description = [
        action.aiContext,
        "",
        `Success Metric: ${action.successMetric}`,
        `Estimated ROI:`,
        `  Time Savings: ${action.estimatedROI.timeSavings}`,
        `  Risk Reduction: ${action.estimatedROI.riskReduction}`,
        `  Cost: ${action.estimatedROI.cost}`,
        `  Payback: ${action.estimatedROI.payback}`,
      ].join("\n");

      return [
        action.title,
        "Story",
        priorityMap[action.impact] ?? "Medium",
        storyPoints.toString(),
        `Sprint ${sprint.number} (${sprint.timeline})`,
        action.owner,
        description,
        "transformation,katalyx",
        deps,
      ];
    })
  );

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  downloadFile(csvContent, `${companyName}-backlog-jira.csv`, "text/csv");
}

/* ── PDF ──────────────────────────────────────────── */

export function exportToPdf(
  data: BacklogData,
  companyName: string,
  scores: { label: string; value: string }[],
  businessContext?: { driver: string; timeline: string; budget: string }
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Brand header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("KATALYX", 15, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Transformation Roadmap", 15, 26);
  doc.setFontSize(12);
  doc.text(companyName, 15, 34);

  y = 50;

  // Executive Summary
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", 15, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Scores
  scores.forEach((s) => {
    doc.text(`${s.label}: ${s.value}`, 15, y);
    y += 5;
  });
  y += 3;

  // Business context
  if (businessContext) {
    doc.text(`Driver: ${businessContext.driver}`, 15, y);
    y += 5;
    doc.text(`Timeline: ${businessContext.timeline}`, 15, y);
    y += 5;
    doc.text(`Budget: ${businessContext.budget}`, 15, y);
    y += 5;
  }
  y += 5;

  const totalActions = data.sprints.reduce((a, s) => a + s.actions.length, 0);
  const totalEffort = data.sprints.reduce(
    (a, s) => a + s.actions.reduce((b, act) => b + act.effort, 0),
    0
  );

  doc.text(
    `This roadmap contains ${data.sprints.length} sprints with ${totalActions} action items totaling ~${totalEffort} hours of effort.`,
    15,
    y,
    { maxWidth: pageWidth - 30 }
  );
  y += 12;

  // Sprint breakdowns
  data.sprints.forEach((sprint) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Sprint ${sprint.number} — ${sprint.timeline} (${sprint.priority})`,
      15,
      y
    );
    y += 3;

    const tableData = sprint.actions.map((action) => [
      action.title,
      action.impact,
      `${action.effort}h`,
      action.owner,
      action.successMetric,
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Action", "Impact", "Effort", "Owner", "Success Metric"]],
      body: tableData,
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 18 },
        2: { cellWidth: 15 },
        3: { cellWidth: 30 },
        4: { cellWidth: 55 },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  });

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by Katalyx · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`${companyName}-transformation-roadmap.pdf`);
}

/* ── helpers ──────────────────────────────────────── */

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
