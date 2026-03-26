import Link from "next/link";
import Heatmap from "./heatmap";

export default function HeatmapPage() {
    return (
        <div>
            <div style={{ display: "flex", gap: "12px", padding: "12px" }}>
                <Link href="/" style={{ textDecoration: "underline" }}>
                    Classification Table
                </Link>
                <Link href="/heatmap" style={{ textDecoration: "underline" }}>
                    Heatmap
                </Link>
            </div>
            <Heatmap />
        </div>
    );
}
