import EmotionTable from "@/components/emotions/EmotionTable";

export default function EmotionsPage() {
  return (
    <main className="h-screen overflow-auto" aria-label="Emotions">
      <EmotionTable />
    </main>
  );
}
