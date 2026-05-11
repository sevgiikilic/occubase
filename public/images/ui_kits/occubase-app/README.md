# OccuBase Web App — UI Kit

A modernized recreation of the OccuBase clinical decision-support app. The original
(at `sevgiikilic/occubase`) is built with React + Vite + Tailwind; this kit reimagines
the same surfaces using the OccuBase Design System tokens.

## What's modernized

| Original                                       | Updated                                                  |
| ---------------------------------------------- | -------------------------------------------------------- |
| `bg-blue-600` primary                          | **Pulse-600 teal** (`#0F7A74`) — distinctive, medical, calmer |
| Slate-100 background                           | **Warm paper** (`#FBFAF7`) for less digital, more clinical feel |
| Inter for everything                           | **Inter Tight** for display + Inter for body                  |
| Lots of `rounded-2xl` cards w/ slate-200       | Cards with **soft warm borders**, layered shadow system  |
| `bg-blue-50` stat tiles                        | One **gradient brand card** as visual anchor, neutral siblings |
| Hard tabs                                      | **Segmented pill control** for category filter           |
| Plain status pills                             | **Status pills with semantic dots** for scan-ability     |

## Screens

`index.html` is the entry — opens on the Login screen, click through Login → Dashboard → Library → Assessment.

- `Login.jsx` — branded teal hero panel + auth form
- `Layout.jsx` — sidebar shell with brand mark
- `Dashboard.jsx` — Hero KPIs, category grid, recent activity
- `Library.jsx` — Search + segmented category filter + disease list with expand
- `Assessment.jsx` — Two-pane form / report with status capsule

## Components

Each is a small, mostly-cosmetic JSX file in this folder:
`Button.jsx`, `Card.jsx`, `Badge.jsx`, `Field.jsx`, `Sidebar.jsx`, `CapacityBadge.jsx`, `Stat.jsx`, `Tabs.jsx`, `StatusRow.jsx`.

## Verifying visually

Open `index.html` directly. Everything runs in-browser via Babel; no build step.
