import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
} from 'docx';

interface Suggestion {
  id: number;
  category: string;
  title: string;
  description: string;
  city?: string | null;
  userName: string;
  createdAt: string;
  commentCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  book: 'Books',
  movie: 'Movies',
  tv: 'TV Shows',
  restaurant: 'Restaurants',
  hotel: 'Hotels',
};

const CATEGORY_ORDER = ['book', 'movie', 'tv', 'restaurant', 'hotel'];

function groupByCategory(suggestions: Suggestion[]) {
  const groups: Record<string, Suggestion[]> = {};
  for (const cat of CATEGORY_ORDER) {
    groups[cat] = suggestions.filter(s => s.category === cat);
  }
  return groups;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Excel export ────────────────────────────────────────────────────────────

export function exportToExcel(suggestions: Suggestion[]) {
  const wb = XLSX.utils.book_new();
  const groups = groupByCategory(suggestions);

  for (const catId of CATEGORY_ORDER) {
    const items = groups[catId];
    if (items.length === 0) continue;

    const isCityCategory = catId === 'restaurant' || catId === 'hotel';
    const nameLabel = isCityCategory ? 'Name' : 'Title';

    const headers = isCityCategory
      ? [nameLabel, 'City', 'Recommended by', 'Date added', 'Description']
      : [nameLabel, 'Recommended by', 'Date added', 'Description'];

    const rows = items.map(s =>
      isCityCategory
        ? [s.title, s.city ?? '', s.userName, formatDate(s.createdAt), s.description]
        : [s.title, s.userName, formatDate(s.createdAt), s.description]
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Column widths
    const colWidths = isCityCategory
      ? [{ wch: 30 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 60 }]
      : [{ wch: 30 }, { wch: 20 }, { wch: 16 }, { wch: 60 }];
    ws['!cols'] = colWidths;

    // Bold header row
    const headerRange = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
    for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[addr]) {
        ws[addr].s = { font: { bold: true } };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, CATEGORY_LABELS[catId]);
  }

  // Summary sheet
  const summaryRows = CATEGORY_ORDER
    .filter(c => groups[c].length > 0)
    .map(c => [CATEGORY_LABELS[c], groups[c].length]);
  const summaryTotal = suggestions.length;
  const summaryWs = XLSX.utils.aoa_to_sheet([
    ['Category', 'Count'],
    ...summaryRows,
    [],
    ['Total', summaryTotal],
  ]);
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `TBD-Recommendations-${date}.xlsx`);
}

// ─── Word export ─────────────────────────────────────────────────────────────

export async function exportToWord(suggestions: Suggestion[]) {
  const groups = groupByCategory(suggestions);
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: 'TBD Recommendations',
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated on ${formatDate(new Date().toISOString())}`,
          color: '888888',
          size: 20,
        }),
      ],
      spacing: { after: 600 },
    })
  );

  for (const catId of CATEGORY_ORDER) {
    const items = groups[catId];
    if (items.length === 0) continue;
    const isCityCategory = catId === 'restaurant' || catId === 'hotel';

    // Category heading
    children.push(
      new Paragraph({
        text: CATEGORY_LABELS[catId],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 160 },
      })
    );

    for (const s of items) {
      // Item title
      children.push(
        new Paragraph({
          children: [new TextRun({ text: s.title, bold: true, size: 24 })],
          spacing: { before: 240, after: 60 },
        })
      );

      // Metadata line
      const metaParts: string[] = [];
      if (isCityCategory && s.city) metaParts.push(s.city);
      metaParts.push(`Shared by ${s.userName}`);
      metaParts.push(formatDate(s.createdAt));

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: metaParts.join('  ·  '), color: '888888', size: 18 }),
          ],
          spacing: { after: 80 },
        })
      );

      // Description
      children.push(
        new Paragraph({
          children: [new TextRun({ text: s.description, size: 20 })],
          spacing: { after: 200 },
        })
      );

      // Divider (thin paragraph border emulated via bottom border on last paragraph)
      children.push(
        new Paragraph({
          text: '',
          border: {
            bottom: {
              color: 'DDDDDD',
              space: 1,
              style: BorderStyle.SINGLE,
              size: 4,
            },
          },
          spacing: { after: 80 },
        })
      );
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `TBD-Recommendations-${date}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
