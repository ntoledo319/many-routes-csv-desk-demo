# a line break inside a CSV cell is not another customer

Disclosure: we made CSV Desk.

This is one fictional record, even though the note occupies two lines:
```
00124;Bea;Support;"First line
Second line"
```
The quotes keep the note together. Splitting the file on every newline would turn it into two broken records. Replacing every semicolon with a comma would also change punctuation inside quoted notes.

In CSV Desk, load the fictional example, keep the source separator on Semicolon and leave cleanup off. Select Inspect batch. The note appears on two lines inside one table cell. Output separator Comma changes the field boundaries while keeping the embedded note intact. Every exported field is quoted; a double quote inside a value is doubled. The app reports logical records, not physical lines.

Switch the preview to Original values and back to Output values. The note stays the same. Bad quoting is rejected with a physical-line error rather than guessed into a different table. If automatic delimiter detection warns about ambiguity, explicitly choose the separator used by your exporting system and inspect the columns.

Try a single file locally in the free demo: https://ntoledo319.github.io/many-routes-csv-desk-demo/. For a folder of recurring exports, inspect the batch edition's ZIP and receipt workflow: https://payhip.com/b/WNTKh. The preview shows a limited number of records; it is not a substitute for testing the full exported file in the destination.

