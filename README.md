# CSV Desk — free single-file CSV demo

A small MIT-licensed CSV inspection and conversion example. Runs entirely in your browser without uploading the selected file.

[Download this repository](https://github.com/ntoledo319/many-routes-csv-desk-demo/archive/refs/heads/main.zip), extract it and open index.html. No build, dependency install or account is needed. Use the fictional sample first.

Supports comma, semicolon, tab and pipe, quoted multiline cells, UTF-8 and BOM-marked UTF-16. Columns stay positional; repeated headers can be explicitly renamed. Output is UTF-8 with a BOM and comma-separated quoted fields. The first record is treated as a header.

Limits: one file up to 5 MiB, 100,000 records, 200 columns and 500,000 cells. Preview shows only the first ten records. Invalid files are rejected. Formula-like values are flagged but exported unchanged. CSV has no spreadsheet type metadata: import IDs as Text in the receiver. This is not a security guarantee or a full spreadsheet editor.

Tested in Chrome 150 on Linux. The demonstration is free; this repository has no payment collection, user accounts, server processing or analytics. Samples are fictional. See LICENSE.txt for reuse rights.
