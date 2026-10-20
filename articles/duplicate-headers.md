# keep both columns when CSV headers repeat

Disclosure: we made CSV Desk.

A CSV with two columns called `name` still has two columns. A tool that turns each row into a dictionary can accidentally keep just one. Before cleaning anything, inspect the original positions.

The included fictional example begins:
```
id;name;name;note
00123;Ada;Operations;"Please call; after lunch"
```
The second `name` is a department. Open CSV Desk, choose **Try a fictional example**, turn on **Give repeated / blank headers unique names**, and select **Inspect batch**. The output headers are `id`, `name`, `name__2`, `note`; the four values are still in their original positions. `00123` remains `00123`.

Switch between Original values and Output values to compare them. Export the reviewed batch and inspect the header map in report.json. Existing suffixes are reserved, so a pre-existing `name__2` is not overwritten. This is a mechanical rename; it does not know which semantic label your receiving system expects. If that system requires `department`, adjust the source export instead.

Try the same header cleanup in the free single-file demo: https://ntoledo319.github.io/many-routes-csv-desk-demo/. The paid batch edition adds the ZIP, change report and original-byte backups: https://payhip.com/b/WNTKh. No account is needed to run the downloaded tool. Test your real receiving-system import before replacing operational data.

