"use client";

type CsvRow = Record<string, string | number | boolean>;

type DownloadCsvButtonProps = {
  filename: string;
  rows: CsvRow[];
  label?: string;
};

function toCsv(rows: CsvRow[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const lines = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val == null) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(","),
  );
  return [headers.join(","), ...lines].join("\n");
}

export function DownloadCsvButton({
  filename,
  rows,
  label = "تصدير CSV",
  className,
}: DownloadCsvButtonProps & { className?: string }) {
  function handleExport() {
    const csv = toCsv(rows);
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" className={className} onClick={handleExport}>
      {label}
    </button>
  );
}
