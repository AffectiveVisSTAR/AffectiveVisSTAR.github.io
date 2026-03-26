"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

type CountsData = Record<string, Record<string, number>>;

type HeatmapCell = {
    domain: string;
    emotion: string;
    value: number;
};

type SortRule = {
    domain: string;
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

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
    const next = [...items];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    return next;
}

export default function Heatmap() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [counts, setCounts] = useState<CountsData | null>(null);
    const [width, setWidth] = useState(900);
    const [domainOrder, setDomainOrder] = useState<string[] | null>(null);
    const [sortRules, setSortRules] = useState<SortRule[]>([]);
    const [alphabeticalEmotions, setAlphabeticalEmotions] = useState(false);

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

    const orderedDomains = useMemo(() => {
        if (!matrix) {
            return [];
        }
        return domainOrder ?? matrix.orderedDomains;
    }, [matrix, domainOrder]);

    const orderedEmotions = useMemo(() => {
        if (!matrix) {
            return [];
        }
        if (alphabeticalEmotions) {
            return [...matrix.orderedEmotions].sort((a, b) => a.localeCompare(b));
        }
        if (sortRules.length === 0) {
            return matrix.orderedEmotions;
        }

        const emotions = [...matrix.orderedEmotions];
        emotions.sort((a, b) => {
            for (const rule of sortRules) {
                const aValue =
                    counts?.[rule.domain]?.[a] ??
                    0;
                const bValue =
                    counts?.[rule.domain]?.[b] ??
                    0;
                const diff = bValue - aValue;
                if (diff !== 0) {
                    return diff;
                }
            }
            return a.localeCompare(b);
        });
        return emotions;
    }, [matrix, sortRules, counts]);

    useEffect(() => {
        if (!matrix || !svgRef.current) {
            return;
        }

        const { cells } = matrix;
        const domains = orderedDomains;
        const emotions = orderedEmotions;
        const margin = { top: 80, right: 30, bottom: 30, left: 220 };
        const rowHeight = 22;
        const height = margin.top + margin.bottom + emotions.length * rowHeight;
        const innerWidth = Math.max(300, width - margin.left - margin.right);
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        svg.attr("width", width).attr("height", height);

        const xScale = d3
            .scaleBand()
            .domain(domains)
            .range([0, innerWidth])
            .padding(0.05);

        const yScale = d3
            .scaleBand()
            .domain(emotions)
            .range([0, innerHeight])
            .padding(0.05);

        const maxValue = d3.max(cells, (d) => d.value) ?? 1;
        const color = d3.scaleSequential(d3.interpolateBlues).domain([0, maxValue]);

        const root = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xAxis = root.append("g").call(d3.axisTop(xScale));

        const ticks = xAxis
            .selectAll<SVGTextElement, string>("text")
            .style("text-anchor", "start")
            .attr("transform", "rotate(-30)")
            .attr("dx", "0.5em")
            .attr("dy", "-0.3em")
            .style("font-size", "11px")
            .style("cursor", "pointer")
            .on("click", (event, domain) => {
                if ((event as PointerEvent).defaultPrevented) {
                    return;
                }
                setSortRules((prev) => {
                    const existingIndex = prev.findIndex((rule) => rule.domain === domain);
                    if (!event.shiftKey) {
                        if (existingIndex === 0 && prev.length === 1) {
                            return prev;
                        }
                        return [{ domain }];
                    }
                    if (existingIndex < 0) {
                        return [...prev, { domain }];
                    }
                    return prev.filter((rule) => rule.domain !== domain);
                });
            });

        root
            .append("g")
            .call(d3.axisLeft(yScale))
            .selectAll("text")
            .style("font-size", "11px");

        const cellGroup = root.append("g");
        cellGroup
            .selectAll("rect")
            .data(cells.filter((d) => domains.includes(d.domain)))
            .join("rect")
            .attr("x", (d) => xScale(d.domain) ?? 0)
            .attr("y", (d) => yScale(d.emotion) ?? 0)
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("rx", 2)
            .attr("fill", (d) => color(d.value));

        cellGroup
            .selectAll("text")
            .data(cells.filter((d) => d.value > 0 && domains.includes(d.domain)))
            .join("text")
            .attr("x", (d) => (xScale(d.domain) ?? 0) + xScale.bandwidth() / 2)
            .attr("y", (d) => (yScale(d.emotion) ?? 0) + yScale.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .style("font-size", "10px")
            .style("fill", "#0b2d52")
            .text((d) => d.value);

        const drag = d3
            .drag<SVGTextElement, string>()
            .on("start", function (event) {
                d3.select(this).style("cursor", "grabbing");
                (event.sourceEvent as PointerEvent).preventDefault();
            })
            .on("drag", function (event) {
                if (event.sourceEvent) {
                    event.sourceEvent.preventDefault();
                }
            })
            .on("end", function (event, d) {
                d3.select(this).style("cursor", "pointer");
                const x = event.x;
                const step = xScale.step();
                const index = Math.max(0, Math.min(domains.length - 1, Math.round(x / step)));
                const fromIndex = domains.indexOf(d);
                if (fromIndex < 0 || index === fromIndex) {
                    return;
                }
                if (event.sourceEvent) {
                    event.sourceEvent.preventDefault();
                }
                setDomainOrder(moveItem(domains, fromIndex, index));
            });

        ticks.call(drag);
    }, [matrix, width, orderedDomains, orderedEmotions, setSortRules]);

    return (
        <div ref={containerRef} style={{ width: "100%", padding: "24px" }}>
            <div style={{ marginBottom: "12px" }}>
                <h1 style={{ margin: 0, fontSize: "24px" }}>Emotion Counts by Domain</h1>
                <p style={{ margin: "6px 0 0", color: "#555" }}>
                    Text text
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                    {/* <button
                        type="button"
                        onClick={() => setSortRules([])}
                        style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#fff",
                            cursor: "pointer",
                        }}
                    >
                        Clear sort
                    </button> */}
                    
                    {/*
                    <button
                        type="button"
                        onClick={() => setAlphabeticalEmotions((prev) => !prev)}
                        style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: alphabeticalEmotions ? "#dbeafe" : "#fff",
                            cursor: "pointer",
                        }}
                    >
                        Alphabetical emotions
                    </button>
                    */}

                    <span style={{ fontSize: "0.85rem", color: "#475569", alignSelf: "center" }}>
                    </span>
                </div>
            </div>
            <div style={{ overflowX: "auto" }}>
                <svg ref={svgRef} />
            </div>
        </div>
    );
}
