"use client";

import { useEffect, useMemo, useState } from "react";
import Table, { type DataTableGroup } from "../table/table";

type CountsData = Record<string, Record<string, number>>;

const DOMAIN_ORDER = [
  "Agnostic",
  "Medicine",
  "Public Health",
  "Social/Civic",
  "Business/Industry",
  "Climate",
  "Science Education",
  "Journalism",
  "Culture/Humanities",
  "Various",
  "(No domain)",
];

function getOrderedDomains(counts: CountsData): string[] {
  const domainsFromData = Object.keys(counts);
  return [
    ...DOMAIN_ORDER.filter((domain) => domainsFromData.includes(domain)),
    ...domainsFromData.filter((domain) => !DOMAIN_ORDER.includes(domain)),
  ];
}

export default function HeatmapTable() {
  const [orderedDomains, setOrderedDomains] = useState<string[]>(DOMAIN_ORDER);

  useEffect(() => {
    let cancelled = false;

    fetch("/counts.json")
      .then((res) => res.json())
      .then((data: CountsData) => {
        if (!cancelled && data && typeof data === "object") {
          const domains = getOrderedDomains(data);
          if (domains.length > 0) {
            setOrderedDomains(domains);
          }
        }
      })
      .catch(() => {
        // Keep fallback order when counts cannot be loaded.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo<DataTableGroup[]>(() => {
    return [
      {
        name: "Emotion",
        color: "#8da0cb",
        columns: [
          {
            dataKey: "Emotion",
            filterType: "text",
            minWidth: 140,
            initialWidth: 220,
          },
        ],
      },
      {
        name: "Domain Counts",
        color: "#66c2a5",
        columns: orderedDomains.map((domain) => ({
          dataKey: domain,
          filterType: "numeric-heatmap" as const,
          minWidth: 26,
          initialWidth: 38,
        })),
      },
    ];
  }, [orderedDomains]);

  return (
    <Table
      groups={groups}
      dataUrl="/heatmap-table.json"
      title="Emotion Counts by Domain"
    />
  );
}
