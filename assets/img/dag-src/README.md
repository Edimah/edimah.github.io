# Figure sources

Each file here compiles to `assets/img/<name>.svg`.

To edit a label: open the `.tex` (any text editor) or the `.drawio` (draw.io desktop), change the text, then run `make figs` from the repository root.

`make figs` needs `latex` and `dvisvgm` (BasicTeX). Without draw.io desktop, the flow figure falls back to a copy of `secret-loyalties-flow.png` from Google Drive, as `assets/img/sl-flow.png`.

`make figs` rebuilds every file below, including the two older DAGs.

| Source              | Figure                                          | Post                           |
| ------------------- | ----------------------------------------------- | ------------------------------ |
| `dag-pooling.tex`   | `dag-pooling.svg`                               | 2026-07-19 rung 1              |
| `dag-censoring.tex` | `dag-censoring.svg`                             | 2026-07-19 rung 1              |
| `sl-dag-score.tex`  | `sl-dag-score.svg`: prompt and names to tau-hat | secret loyalties, outputs only |
| `sl-dag-test.tex`   | `sl-dag-test.svg`: sign-flip test               | secret loyalties, outputs only |
| `sl-dag-did.tex`    | `sl-dag-did.svg`: difference in differences     | secret loyalties, outputs only |
| `sl-flow.drawio`    | `sl-flow.svg`: experiment flow                  | secret loyalties, outputs only |

The `.tex` files must keep `\documentclass[dvisvgm,...]{standalone}` on their first line.
