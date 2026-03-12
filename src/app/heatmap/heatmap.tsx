"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

type CountsData = Record<string, Record<string, number>>;

type HeatmapCell = {
    domain: string;
    emotion: string;
    value: number;
};

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

function buildMatrix(counts: CountsData) {
    const domainsFromData = Object.keys(counts);
    const orderedDomains = [
        ...DOMAIN_ORDER.filter((domain) => domainsFromData.includes(domain)),
        ...domainsFromData.filter((domain) => !DOMAIN_ORDER.includes(domain)),
    ];

    const emotionSet = new Set<string>();
    for (const domain of domainsFromData) {
        for (const emotion of Object.keys(counts[domain] || {})) {
            emotionSet.add(emotion);
        }
    }

    const emotions = Array.from(emotionSet);
    const emotionTotals = new Map<string, number>();
    for (const emotion of emotions) {
        let total = 0;
        for (const domain of domainsFromData) {
            total += counts[domain]?.[emotion] ?? 0;
        }
        emotionTotals.set(emotion, total);
    }

    const orderedEmotions = emotions.sort((a, b) => {
        const diff = (emotionTotals.get(b) ?? 0) - (emotionTotals.get(a) ?? 0);
        return diff !== 0 ? diff : a.localeCompare(b);
    });

    const cells: HeatmapCell[] = [];
    for (const domain of orderedDomains) {
        for (const emotion of orderedEmotions) {
            cells.push({
                domain,
                emotion,
                value: counts[domain]?.[emotion] ?? 0,
            });
        }
    }

    return { orderedDomains, orderedEmotions, cells };
}

export default function Heatmap() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [counts, setCounts] = useState<CountsData | null>(null);
    const [width, setWidth] = useState(900);

    useEffect(() => {
        let cancelled = false;
        fetch("/counts.json")
            .then((res) => res.json())
            .then((data: CountsData) => {
                if (!cancelled) {
                    setCounts(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setCounts({});
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect?.width) {
                    setWidth(Math.max(500, Math.floor(entry.contentRect.width)));
                }
            }
        });
        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    const matrix = useMemo(() => {
        if (!counts) {
            return null;
        }
        return buildMatrix(counts);
    }, [counts]);

    useEffect(() => {
        if (!matrix || !svgRef.current) {
            return;
        }

        const { orderedDomains, orderedEmotions, cells } = matrix;
        const margin = { top: 80, right: 30, bottom: 30, left: 220 };
        const rowHeight = 22;
        const height = margin.top + margin.bottom + orderedEmotions.length * rowHeight;
        const innerWidth = Math.max(300, width - margin.left - margin.right);
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        svg.attr("width", width).attr("height", height);

        const xScale = d3
            .scaleBand()
            .domain(orderedDomains)
            .range([0, innerWidth])
            .padding(0.05);

        const yScale = d3
            .scaleBand()
            .domain(orderedEmotions)
            .range([0, innerHeight])
            .padding(0.05);

        const maxValue = d3.max(cells, (d) => d.value) ?? 1;
        const color = d3.scaleSequential(d3.interpolateBlues).domain([0, maxValue]);

        const root = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        root
            .append("g")
            .call(d3.axisTop(xScale))
            .selectAll("text")
            .style("text-anchor", "start")
            .attr("transform", "rotate(-30)")
            .attr("dx", "0.5em")
            .attr("dy", "-0.3em")
            .style("font-size", "11px");

        root
            .append("g")
            .call(d3.axisLeft(yScale))
            .selectAll("text")
            .style("font-size", "11px");

        const cellGroup = root.append("g");
        cellGroup
            .selectAll("rect")
            .data(cells)
            .join("rect")
            .attr("x", (d) => xScale(d.domain) ?? 0)
            .attr("y", (d) => yScale(d.emotion) ?? 0)
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("rx", 2)
            .attr("fill", (d) => color(d.value));

        cellGroup
            .selectAll("text")
            .data(cells.filter((d) => d.value > 0))
            .join("text")
            .attr("x", (d) => (xScale(d.domain) ?? 0) + xScale.bandwidth() / 2)
            .attr("y", (d) => (yScale(d.emotion) ?? 0) + yScale.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .style("font-size", "10px")
            .style("fill", "#0b2d52")
            .text((d) => d.value);
    }, [matrix, width]);

    return (
        <div ref={containerRef} style={{ width: "100%", padding: "24px" }}>
            <div style={{ marginBottom: "12px" }}>
                <h1 style={{ margin: 0, fontSize: "24px" }}>Emotion Counts by Domain</h1>
                <p style={{ margin: "6px 0 0", color: "#555" }}>
                    SpecificEmotionsCleaned counts grouped by application domain.
                </p>
            </div>
            <div style={{ overflowX: "auto" }}>
                <svg ref={svgRef} />
            </div>
        </div>
    );
}
