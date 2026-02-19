# Jot

A minimal, local-first note-taking app for macOS (and Windows/Linux). Notes are saved as plain files on your disk — no accounts, no cloud lock-in.

## Features

- **Rich text editing** via Tiptap — headings, bold, italic, lists, code blocks, images, and more
- **Folders** — organize notes into custom folders
- **Smart folders** — All Notes, Pinned, Trash built in
- **Hashtag support** — tag notes inline with `#hashtag` and filter from the sidebar
- **Local storage** — every note is a plain file in a folder you choose (Documents, iCloud, Dropbox, etc.)
- **Dark / light mode**
- **Collapsible sidebar**
- **Onboarding** — pick your notes folder on first launch

## Tech Stack

- [Tauri v2](https://tauri.app) — native desktop shell
- [React 19](https://react.dev) + TypeScript
- [Tiptap](https://tiptap.dev) — rich text editor
- [Tailwind CSS v4](https://tailwindcss.com)
- [Zustand](https://zustand.pmnd.rs) — state management
- [Vite](https://vite.dev)

## Development

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Rust](https://www.rust-lang.org/tools/install) (for the Tauri build)

```sh
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Install & run

```sh
npm install
npm run tauri dev
```

### Build for production

```sh
cargo tauri build
```

Installers are output to `src-tauri/target/release/bundle/`:
- macOS → `.dmg` / `.app`
- Windows → `.msi` / `.exe`
- Linux → `.deb` / `.AppImage`

## License

MIT
