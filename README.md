# bear-cli

Manage your [Bear](https://bear.app) notes from the terminal. List, search, create, edit, tag, export -- without leaving the command line.

Zero npm dependencies. Just Node.js and your Bear database.

## How it Works

bear-cli takes a hybrid approach:

- **Reads** hit Bear's SQLite database directly. Fast, works without Bear running, doesn't steal window focus. The database is opened read-only -- no risk of corruption.

- **Writes** go through Bear's `bear://x-callback-url` scheme. Mutations flow through the app, so sync, undo history, and everything else works the way Bear expects. Bear needs to be running for write commands.

## Requirements

- macOS
- [Node.js](https://nodejs.org) 22+ (uses the built-in `node:sqlite` module)
- [Bear](https://bear.app) installed

## Installing

```bash
npm install -g bear-notes-cli
```

Or from source:

```bash
git clone https://github.com/Robdel12/bear-notes-cli.git
cd bear-cli
npm link
```

No `npm install` needed. There are no dependencies to fetch.

## Getting Started

Check that everything's wired up:

```bash
bear stats
```

```
Notes
  Active:     142
  Archived:   8
  Trashed:    23
  Pinned:     3
  Encrypted:  0
  Total:      173

Attachments: 7 notes with files/images (12 files)
Tags:        34
Backlinks:   89
Todos:       56 done, 31 remaining
```

## Commands

Every command supports `--help` for usage details and `--json` for structured output.

### Listing Notes

```bash
bear list                              # 20 most recently modified notes
bear list --limit 50                   # more results
bear list --tag work                   # filter by tag
bear list --tag work/projects          # nested tags work too
bear list --archived                   # archived notes
bear list --trashed                    # trashed notes
bear list --pinned                     # pinned only
bear list --has-todo                   # notes with task lists
bear list --sort created --order asc   # oldest first
bear list --sort title                 # alphabetical
```

`bear ls` works too.

Output shows the title, UUID, last modified date, and status flags:

```
App launch checklist
  A3F1B892-D7AA-4F8C-BDDE-D37ED78DB384  2025-11-28  [todo:18/26]

Weekend reading list
  7CC566FB-CE72-4FB2-8009-1293DB2F9166  2025-10-31

Recipe ideas
  E6FF22C8-1DA0-4396-BEBD-61B0185F864B  2025-10-14
```

### Getting a Note

Look up a note by UUID or title:

```bash
bear get "App launch checklist"              # by title
bear get A3F1B892-D7AA-4F8C-BDDE            # by UUID
bear get "App launch checklist" --content    # include full note text
bear get "App launch checklist" --with-tags  # include tag names
```

Title matching is case-insensitive with fuzzy fallback.

### Searching

Search across all note content:

```bash
bear search "API design"               # search everything
bear search "API design" --limit 5     # cap results
bear search "deploy" --tag work        # search within a tag
```

Results include a snippet around the match:

```
Infrastructure Notes
  F7A8B9C0-...  2025-09-15
  ...the deploy pipeline should handle rollbacks automatically. API design for the...
```

### Browsing Tags

Bear tags are hierarchical (`work/projects`). The `tags` command shows them as a tree:

```bash
bear tags                    # tree view
bear tags --flat             # flat list
bear tags --with-counts      # note count per tag
```

```
cooking (12)
  recipes (8)
  meal-prep (4)
work (15)
  projects (6)
  meetings (5)
  ideas (4)
```

### Viewing Backlinks

See which notes link to a given note and which notes it links to:

```bash
bear backlinks "Project Roadmap"
```

```
Backlinks for "Project Roadmap"

Linked by:
  Sprint Planning  (4A2B1C3D-E5F6-7890-ABCD-EF1234567890)
  Q1 Goals  (8B3C2D4E-F6A7-8901-BCDE-F12345678901)

Links to:
  Architecture Decisions  (C4D5E6F7-A8B9-0123-CDEF-123456789012)
  Team Standup Notes  (D5E6F7A8-B9C0-1234-DEFA-234567890123)
```

### Exporting a Note

Dump a note's markdown to stdout or a file:

```bash
bear export "My Note"                  # stdout
bear export "My Note" -o note.md       # file
bear --json export "My Note"           # JSON with metadata
```

Composes well with other tools:

```bash
bear export "Meeting Notes" | pbcopy              # clipboard
bear export "Draft Post" | wc -w                  # word count
bear export "Config" > ~/Desktop/config-backup.md # file backup
```

### Creating Notes

Bear needs to be running for this.

```bash
bear create --title "New Idea" --text "Something interesting"
bear create --title "Tagged" --tags "work,ideas"
bear create --title "Pinned" --pin
bear create --title "Quick Note" --open     # open in Bear after creating
```

Reads from stdin too:

```bash
echo "# Meeting Notes\n\n- Point 1\n- Point 2" | bear create --title "Standup"
cat draft.md | bear create --title "Blog Draft" --tags "personal/blog"
pbpaste | bear create --title "From Clipboard"
```

`bear new` works as an alias.

### Editing Notes

Append, prepend, or replace text in an existing note:

```bash
bear edit "My Note" --text "Appended line"
bear edit "My Note" --text "First line" --mode prepend
bear edit "My Note" --text "New content" --mode replace_all
bear edit "My Note" --text "Under heading" --header "Section 2"
bear edit "My Note" --tags "newtag"
```

Stdin works here too:

```bash
echo "New paragraph" | bear edit "My Note"
cat additions.md | bear edit "My Note" --mode append
```

### Opening in Bear

```bash
bear open "My Note"                    # bring it up
bear open "My Note" --edit             # cursor ready to type
bear open "My Note" --header "Setup"   # jump to a heading
bear open "My Note" --new-window       # separate window
```

### Trashing and Archiving

```bash
bear trash "Old Note" --yes            # --yes required as a safety guard
bear archive "Done Note"
```

### Managing Tags

```bash
bear tag-rename old-name new-name
bear tag-delete stale-tag --yes        # --yes required as a safety guard
```

These affect every note that uses the tag.

### Stats

```bash
bear stats
```

Counts for active, archived, trashed, pinned, and encrypted notes. Plus totals for tags, backlinks, attachments, and todos.

## JSON Output

Pass `--json` to any command for structured output. Fields use camelCase instead of Bear's internal Core Data naming:

```bash
bear --json list --limit 2
```

```json
[
  {
    "id": "A3F1B892-D7AA-4F8C-BDDE-D37ED78DB384",
    "title": "App launch checklist",
    "subtitle": "Final items before the release goes out...",
    "created": "2025-10-12T14:30:01.329Z",
    "modified": "2025-11-28T09:15:42.070Z",
    "pinned": false,
    "archived": false,
    "trashed": false,
    "hasFiles": false,
    "hasImages": false,
    "todosComplete": 18,
    "todosIncomplete": 8
  }
]
```

Pairs well with `jq`:

```bash
# IDs of all notes tagged "work"
bear --json list --tag work | jq -r '.[].id'

# Count notes by month
bear --json list --limit 100 | jq -r '.[].created[:7]' | sort | uniq -c

# Notes with unfinished todos
bear --json list --has-todo | jq '.[] | select(.todosIncomplete > 0) | .title'
```

## Configuration

Config lives at `~/.bear-cli.json`.

```bash
bear config set defaultLimit 50        # change default list limit
bear config set defaultSort created    # change default sort
bear config get defaultLimit           # check a value
bear config list                       # show all settings
bear config path                       # print config file location
```

## Architecture

```
bear-cli/
├── bin/bear.js           # Entry point + command router
├── lib/
│   ├── constants.js      # Database path, Core Data epoch, URL scheme
│   ├── config.js         # Read/write ~/.bear-cli.json
│   ├── db.js             # SQLite queries (read-only)
│   ├── xcallback.js      # bear:// URL builder + executor
│   ├── format.js         # Human-readable + JSON output formatting
│   └── commands/         # One file per command
│       ├── list.js
│       ├── get.js
│       ├── search.js
│       ├── tags.js
│       ├── backlinks.js
│       ├── stats.js
│       ├── export.js
│       ├── create.js
│       ├── edit.js
│       ├── open.js
│       ├── trash.js
│       ├── archive.js
│       ├── tag-rename.js
│       ├── tag-delete.js
│       └── config.js
└── package.json
```

**Zero npm dependencies.** Everything comes from Node.js builtins:

- `node:sqlite` -- SQLite support (Node 22+)
- `node:util` -- `parseArgs` for CLI argument parsing
- `node:child_process` -- `execSync` to open bear:// URLs
- `node:fs` -- config and export file operations

Commands are lazy-loaded -- only the one you run gets imported. Startup stays fast.

## How Bear Stores Data

For the curious:

- **Database**: Core Data SQLite at `~/Library/Group Containers/9K33E3U3T4.net.shinyfrog.bear/Application Data/database.sqlite`
- **Notes**: `ZSFNOTE` -- title, text, timestamps, status flags, todo counts
- **Tags**: `ZSFNOTETAG` -- hierarchical paths separated by `/`
- **Join table**: `Z_5TAGS` -- many-to-many between notes and tags
- **Backlinks**: `ZSFNOTEBACKLINK` -- tracks `[[wiki-style]]` links between notes
- **Files**: `ZSFNOTEFILE` -- attachment metadata (images, PDFs, etc.)
- **Timestamps**: Seconds since 2001-01-01 (Core Data epoch). Add `978307200` for Unix time.

The database is shared between Bear and its extensions via the app group `9K33E3U3T4.net.shinyfrog.bear`.

## License

MIT
