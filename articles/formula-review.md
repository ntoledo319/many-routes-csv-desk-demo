# look at formula-like values before opening a CSV in a spreadsheet

Disclosure: we made CSV Desk.

A value such as `=1+1` is just text to a CSV parser. A spreadsheet may evaluate it as a formula. Quoting a CSV field does not by itself guarantee it will stay inert.

The CSV Desk fictional example includes that value in one note. Load the sample and inspect it with formula prefixing off: the warning counts one formula-like cell, and the value is unchanged. Now turn on **Prefix formula-like cells with an apostrophe**, inspect again and compare the Output values preview. The note becomes `'=1+1`. In the batch ZIP, report.json records the original record and column of that change.

This option intentionally alters data. A negative amount such as `-100` is also flagged, so do not apply it indiscriminately to machine imports or numeric data. Headers are scanned too. Spreadsheet behavior varies, and re-saving a file can change that behavior; no universal security guarantee is offered. The tool itself never evaluates formulas.

Try the free single-file demo to inspect a file and see its formula warnings: https://ntoledo319.github.io/many-routes-csv-desk-demo/. Its download preserves those values unchanged. The paid batch workflow offers the explicit prefix option and report: https://payhip.com/b/WNTKh. Keep an original copy and test the receiving application.

