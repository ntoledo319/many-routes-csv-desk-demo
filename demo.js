'use strict';
const $ = id => document.getElementById(id); let source = null, result = null, busy = false, sampleLoaded = false;
function reset(message) { result = null; $('preview').textContent = ''; $('ack').checked = false; $('ack').disabled = true; $('save').disabled = true; $('status').textContent = message; }
$('file').addEventListener('change', () => { if (sampleLoaded) { $('delimiter').value = 'auto'; sampleLoaded = false; } source = $('file').files[0] || null; reset(source ? source.name + ' selected. Inspect to continue.' : 'No file selected.'); });
$('sample').addEventListener('click', () => { source = new File(['id;name;name\n00123;Ada;Ops\n00124;Bea;Support\n'], 'fictional-sample.csv'); $('delimiter').value = ';'; sampleLoaded = true; reset('Fictional sample loaded. Inspect to continue.'); });
['delimiter','rename'].forEach(id => $(id).addEventListener('change', () => reset('Options changed. Inspect again.')));
$('form').addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return; reset('Inspecting…');
  if (!source) { $('status').textContent = 'Choose a file or load the sample first.'; return; }
  if (source.size > CSVDesk.LIMITS.bytes) { $('status').textContent = 'File exceeds 5 MiB. Choose a smaller file.'; return; }
  busy = true; document.querySelectorAll('button,input,select').forEach(el => el.disabled = true);
  try {
    result = CSVDesk.process(new Uint8Array(await source.arrayBuffer()), { delimiter:$('delimiter').value === 'tab' ? '\t' : $('delimiter').value, header:true, rename:$('rename').checked, bom:true });
    const i = result.report.input;
    $('preview').textContent = CSVDesk.serialize(result.rows.slice(0,10));
    $('status').textContent = i.dataRows + ' data records. ' + i.duplicateHeaders.length + ' repeated headers; ' + i.ragged.length + ' unequal-width records; ' + i.formulas.length + ' formula-like cells (unchanged). ' + result.report.delimiterWarning;
  } catch (error) { $('status').textContent = error.message; }
  finally { busy = false; document.querySelectorAll('button,input,select').forEach(el => el.disabled = false); $('ack').disabled = !result; $('save').disabled = true; }
});
$('ack').addEventListener('change', () => $('save').disabled = !$('ack').checked || !result);
$('save').addEventListener('click', () => {
  if (!result || !$('ack').checked) return;
  const url = URL.createObjectURL(new Blob([result.output], {type:'text/csv;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = 'csv-desk-copy.csv'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
});
