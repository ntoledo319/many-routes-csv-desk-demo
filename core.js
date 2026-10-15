/* CSV Desk 1.0.0 — original implementation. No network or runtime dependencies. */
(function (root) {
  'use strict';
  const LIMITS = Object.freeze({ bytes: 5 * 1024 * 1024, batchBytes: 20 * 1024 * 1024, files: 10, rows: 100000, columns: 200, cells: 500000 });
  const delimiters = [',', ';', '\t', '|'];
  function assertDelimiter(value) {
    if (!delimiters.includes(value)) throw new Error('Choose comma, semicolon, tab or pipe.');
  }
  function decode(bytes, encoding = 'auto') {
    if (!(bytes instanceof Uint8Array)) throw new Error('Expected file bytes.');
    if (bytes.length > LIMITS.bytes) throw new Error('File exceeds the 5 MiB limit.');
    const bom = bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le' : bytes[0] === 0xfe && bytes[1] === 0xff ? 'utf-16be' : bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 'utf-8' : null;
    const chosen = encoding === 'auto' ? bom || 'utf-8' : encoding;
    if (!['utf-8', 'utf-16le', 'utf-16be', 'windows-1252'].includes(chosen)) throw new Error('Unsupported encoding.');
    if (bom && chosen !== bom) throw new Error('Encoding conflicts with the file BOM. Choose automatic or ' + bom + '.');
    let text;
    try { text = new TextDecoder(chosen, { fatal: true }).decode(bytes); }
    catch { throw new Error('Invalid ' + chosen + ' bytes. Confirm the source encoding; Windows-1252 is available for legacy exports.'); }
    if (text.includes('\0')) throw new Error('NUL bytes found. Choose the correct encoding; binary files are unsupported.');
    return { text, encoding: chosen, bom: Boolean(bom) };
  }
  function parse(text, delimiter = ',') {
    assertDelimiter(delimiter);
    text = text.replace(/^\uFEFF/, '');
    if (!text.length) throw new Error('The file is empty.');
    const rows = []; let row = [], field = '', quoted = false, closed = false, active = false, cells = 0, line = 1;
    const fail = message => { throw new Error(message + ' At physical line ' + line + '.'); };
    const cell = () => {
      row.push(field); field = ''; closed = false;
      if (row.length > LIMITS.columns || ++cells > LIMITS.cells) fail('File exceeds the 200-column or 500,000-cell limit.');
    };
    const record = () => {
      cell(); rows.push(row); row = []; active = false;
      if (rows.length > LIMITS.rows) fail('File exceeds the 100,000-record limit.');
    };
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { quoted = false; closed = true; }
        } else { field += ch; if (ch === '\n' || (ch === '\r' && text[i + 1] !== '\n')) line++; }
        continue;
      }
      if (closed && ch !== delimiter && ch !== '\r' && ch !== '\n') fail('Unexpected text after a closing quote. Repair the source quoting.');
      if (ch === '"') {
        if (field.length) fail('Quote inside an unquoted field. Repair the source quoting.');
        quoted = true; active = true;
      } else if (ch === delimiter) { cell(); active = true; }
      else if (ch === '\n' || ch === '\r') {
        record(); if (ch === '\r' && text[i + 1] === '\n') i++; line++;
      } else { field += ch; active = true; }
    }
    if (quoted) fail('Unclosed quoted field. Repair the source quoting.');
    if (active || row.length || closed || field.length) record();
    return rows;
  }
  function detect(text) {
    // Count separators outside quotes in the first 40 logical records. Never split a quoted newline.
    let quote = false, count = [0, 0, 0, 0], hasText = false; const samples = [];
    for (let i = 0; i < text.length && samples.length < 40; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (quote && text[i + 1] === '"') i++; else quote = !quote;
      } else if (!quote && (ch === '\r' || ch === '\n')) {
        if (hasText) samples.push(count);
        count = [0, 0, 0, 0]; hasText = false;
        if (ch === '\r' && text[i + 1] === '\n') i++;
      } else {
        hasText = true;
        const index = delimiters.indexOf(ch); if (!quote && index !== -1) count[index]++;
      }
    }
    if (hasText && samples.length < 40) samples.push(count);
    const scores = delimiters.map((delimiter, index) => {
      const counts = samples.map(x => x[index]);
      const frequencies = new Map();
      counts.filter(x => x > 0).forEach(x => frequencies.set(x, (frequencies.get(x) || 0) + 1));
      const best = [...frequencies].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
      return { delimiter, score: best ? best[1] / Math.max(1, counts.length) : 0 };
    }).sort((a, b) => b.score - a.score);
    if (!scores[0].score) return { delimiter: ',', uncertain: true, reason: 'No separator detected. Confirm comma for a single-column file or choose the correct separator.' };
    const uncertain = scores[0].score === scores[1].score || scores[0].score < 1;
    return { delimiter: scores[0].delimiter, uncertain, reason: uncertain ? 'Separator is ambiguous or row widths vary. Choose the source separator explicitly and inspect the preview.' : '' };
  }
  function formulaLike(value) { return /^[\s\u0000-\u001f]*[=+\-@＝＋－＠]/u.test(value) || /^[\t\r\n]/.test(value); }
  function inspect(rows, header = true) {
    const width = rows[0].length, names = new Map(), duplicateHeaders = [], blankHeaders = [], ragged = [], duplicateRows = [], formulas = [];
    if (header) rows[0].forEach((value, i) => {
      if (!value.trim()) blankHeaders.push(i + 1);
      if (names.has(value)) duplicateHeaders.push({ column: i + 1, first: names.get(value), name: value });
      else names.set(value, i + 1);
    });
    const seen = new Map(); let blankRows = 0;
    rows.forEach((row, i) => {
      if (row.length !== width) ragged.push(i + 1);
      row.forEach((value, j) => { if (formulaLike(value)) formulas.push({ record: i + 1, column: j + 1 }); });
      if (header && !i) return;
      if (row.every(v => !v.trim())) blankRows++;
      const key = JSON.stringify(row);
      if (seen.has(key)) duplicateRows.push({ record: i + 1, first: seen.get(key) }); else seen.set(key, i + 1);
    });
    return { records: rows.length, dataRows: rows.length - (header ? 1 : 0), columns: width, duplicateHeaders, blankHeaders, ragged, duplicateRows, blankRows, formulas };
  }
  function transform(rows, options = {}) {
    const header = options.header !== false, changes = { trimmedCells: 0, renamedHeaders: [], removedBlankRecords: [], removedDuplicateRecords: [], prefixedCells: [] };
    const original = rows.map((row, i) => ({ record: i + 1, row: row.map((value, column) => {
      let next = options.trim ? value.trim() : value;
      if (value !== next) changes.trimmedCells++;
      if (header && i === 0 && options.prefix && formulaLike(next)) {
        changes.prefixedCells.push({ record: 1, column: column + 1 }); next = "'" + next;
      }
      return next;
    }) }));
    if (header && options.rename) {
      const names = original[0].row, reserved = new Set(names), used = new Set();
      original[0].row = names.map((value, i) => {
        let name = value, base = value.trim() ? value : 'column_' + (i + 1), suffix = 2;
        if (!value.trim() || used.has(value)) {
          name = base;
          while (used.has(name) || reserved.has(name)) name = base + '__' + suffix++;
        }
        used.add(name);
        if (name !== value) changes.renamedHeaders.push({ column: i + 1, from: value, to: name });
        return name;
      });
    }
    const seen = new Set(), out = [];
    for (const entry of original) {
      const isHeader = header && entry.record === 1;
      if (!isHeader && options.blank && entry.row.every(value => !value.trim())) { changes.removedBlankRecords.push(entry.record); continue; }
      const key = JSON.stringify(entry.row);
      if (!isHeader && options.dedupe && seen.has(key)) { changes.removedDuplicateRecords.push(entry.record); continue; }
      if (!isHeader) seen.add(key);
      out.push(entry.row.map((value, column) => {
        if (!isHeader && options.prefix && formulaLike(value)) { changes.prefixedCells.push({ record: entry.record, column: column + 1 }); return "'" + value; }
        return value;
      }));
    }
    return { rows: out, changes };
  }
  function serialize(rows, delimiter = ',', bom = false) {
    assertDelimiter(delimiter);
    // Quote every field, including an empty one-column record, to make round-trips unambiguous.
    return (bom ? '\uFEFF' : '') + rows.map(row => row.map(v => '"' + v.replace(/"/g, '""') + '"').join(delimiter)).join('\r\n') + (rows.length ? '\r\n' : '');
  }
  function process(bytes, options = {}) {
    const decoded = decode(bytes, options.encoding || 'auto');
    const detection = options.delimiter && options.delimiter !== 'auto' ? { delimiter: options.delimiter, uncertain: false, reason: '' } : detect(decoded.text);
    const before = parse(decoded.text, detection.delimiter), input = inspect(before, options.header !== false);
    const result = transform(before, options), output = serialize(result.rows, options.output || ',', !!options.bom);
    return { before, rows: result.rows, output, report: { version: '1.0.0', encoding: decoded.encoding, inputBOM: decoded.bom, sourceDelimiter: detection.delimiter, delimiterWarning: detection.reason, options: { ...options }, input, result: { records: result.rows.length }, changes: result.changes } };
  }
  root.CSVDesk = Object.freeze({ LIMITS, parse, decode, detect, formulaLike, inspect, transform, serialize, process });
})(globalThis);
