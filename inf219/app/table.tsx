"use client";

import { useEffect, useState } from "react";

type Row = {
  AuthorYear?: string;
  Year?: number;
  "Paper Nickname"?: string;
};

export default function Table() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/classtable.json");
        const data = await response.json();

        setRows(data);
      } catch (error) {
        console.error("Kunne ikke laste classtable.json:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <p>Laster...</p>;
  }

  return (
    <div className="p-4">
      <table className="border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">AuthorYear</th>
            <th className="border border-gray-300 p-2">Year</th>
            <th className="border border-gray-300 p-2">
              Paper Nickname
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td className="border border-gray-300 p-2">
                {row.AuthorYear}
              </td>
              <td className="border border-gray-300 p-2">
                {row.Year}
              </td>
              <td className="border border-gray-300 p-2">
                {row["Paper Nickname"]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}