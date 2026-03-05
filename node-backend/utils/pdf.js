// Minimal PDF generator for simple tabular text (no external deps)
// Produces a single-page PDF with monospaced Courier text.
//
// This implementation keeps the PDF structure very small and computes
// xref offsets deterministically (to avoid corrupted PDFs).

function escapePdfText(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r|\n/g, ' ');
}

function makeContentStream(lines, { x = 40, y = 780, fontSize = 10, leading = 12 } = {}) {
  const parts = [];
  parts.push('BT');
  parts.push(`/F1 ${fontSize} Tf`);
  parts.push(`${leading} TL`);
  parts.push(`${x} ${y} Td`);
  for (const line of lines) {
    parts.push(`(${escapePdfText(line)}) Tj`);
    parts.push('T*');
  }
  parts.push('ET');
  return parts.join('\n');
}

function makePdf({ title = 'Export', headers = [], rows = [], maxWidth = 100 } = {}) {
  const clip = (v) => {
    const s = String(v == null ? '' : v);
    if (s.length <= maxWidth) return s;
    return s.slice(0, Math.max(0, maxWidth - 1)) + '…';
  };

  const lines = [];
  lines.push(title);

  if (headers.length) {
    const headerLine = headers.join(' | ');
    lines.push(headerLine);
    lines.push('-'.repeat(Math.min(120, headerLine.length)));
  }

  for (const r of rows || []) {
    const vals = headers.length
      ? headers.map((h) => clip(r && r[h]))
      : Object.values(r || {}).map(clip);
    lines.push(vals.join(' | '));
  }

  const content = Buffer.from(makeContentStream(lines), 'utf8');

  // Objects (1..5)
  const obj1 = Buffer.from('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n', 'utf8');
  const obj2 = Buffer.from('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n', 'utf8');
  const obj3 = Buffer.from(
    '3 0 obj\n' +
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
      '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\n' +
      'endobj\n',
    'utf8'
  );
  const obj4 = Buffer.from('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n', 'utf8');
  const obj5Header = Buffer.from(`5 0 obj\n<< /Length ${content.length} >>\nstream\n`, 'utf8');
  const obj5Footer = Buffer.from('\nendstream\nendobj\n', 'utf8');

  const header = Buffer.from('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n', 'binary');

  const parts = [header, obj1, obj2, obj3, obj4, obj5Header, content, obj5Footer];

  // Compute xref offsets (for objects 1..5)
  const offsets = [];
  let pos = header.length;
  offsets.push(pos); // obj1
  pos += obj1.length;
  offsets.push(pos); // obj2
  pos += obj2.length;
  offsets.push(pos); // obj3
  pos += obj3.length;
  offsets.push(pos); // obj4
  pos += obj4.length;
  offsets.push(pos); // obj5
  pos += obj5Header.length + content.length + obj5Footer.length;

  const xrefStart = pos;
  const pad10 = (n) => String(n).padStart(10, '0');

  let xref = '';
  xref += 'xref\n';
  xref += '0 6\n';
  xref += '0000000000 65535 f \n';
  for (const off of offsets) xref += `${pad10(off)} 00000 n \n`;
  xref += 'trailer\n';
  xref += '<< /Size 6 /Root 1 0 R >>\n';
  xref += 'startxref\n';
  xref += `${xrefStart}\n`;
  xref += '%%EOF\n';

  return Buffer.concat([...parts, Buffer.from(xref, 'utf8')]);
}

module.exports = { makePdf };
