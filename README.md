# Journalon

A simple, elegant journaling web application with a chat-like interface. Write your thoughts and reflections in a private, secure environment that stores all data locally in your browser.

## Features

- **Chat-like Interface**: Write journal entries in a conversational format
- **Private & Secure**: All data stored locally in your browser using IndexedDB
- **Multiple Journals**: Create and manage multiple journals with unique IDs
- **Export/Import**: Download journals as JSON files or import existing ones
- **Responsive Design**: Clean, Material-UI based interface with max width
- **Entry Management**: Edit, delete, and timestamp all your entries
- **No Backend Required**: Fully client-side application

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **UI Framework**: Material-UI (MUI) v7
- **Database**: IndexedDB via Dexie
- **Routing**: React Router v7
- **Build Tool**: Vite
- **Deployment**: GitHub Pages

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd journalon
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173/journalon/`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## How It Works

### Journal Structure

Each journal has:
- **Public Key**: SHA-1 hash of the private key (serves as journal ID)
- **Private Key**: UUID generated for journal ownership proof
- **Title**: User-defined journal name
- **Entries**: List of timestamped text entries
- **Metadata**: Creation and modification timestamps

### Data Storage

- All data is stored locally in your browser's IndexedDB
- No data is sent to external servers
- Data persists across browser sessions
- Each journal is identified by its public key (SHA-1 hash)

### Security & Privacy

- Private keys are generated locally and never exported
- Only public keys, titles, and entries are included in exported JSON files
- All processing happens client-side
- No tracking or analytics

## Usage

### Creating a Journal

1. Click the blue "+" button on the home page
2. Enter a title for your journal
3. Click "CREATE"

### Writing Entries

1. Click on a journal to open it
2. Type your entry in the text field at the bottom
3. Press Enter or click the send button
4. Entries appear in chronological order (newest at bottom)

### Managing Journals

- **Edit**: Click the pencil icon to open the journal
- **Export**: Click the download icon to save as JSON
- **Delete**: Click the trash icon to permanently remove
- **Import**: Click "IMPORT" button on home page to upload a JSON file

### Entry Features

- **Edit**: Hover over an entry and click the edit icon
- **Delete**: Hover over an entry and click the delete icon
- **Timestamps**: Each entry shows day, date, and time

## Deployment

The application is configured for GitHub Pages deployment with GitHub Actions:

1. Push to the `main` branch
2. GitHub Actions will automatically build and deploy
3. The app will be available at `https://yourusername.github.io/journalon/`

## File Structure

```
journalon/
├── src/
│   ├── components/          # React components
│   │   ├── HomePage.tsx     # Main journal list page
│   │   ├── JournalView.tsx  # Individual journal view
│   │   ├── EntryItem.tsx    # Individual entry component
│   │   └── Layout.tsx       # App layout wrapper
│   ├── services/            # Business logic
│   │   ├── database.ts      # IndexedDB setup
│   │   ├── journalService.ts # Journal operations
│   │   └── cryptoService.ts # Key generation
│   ├── utils/               # Utility functions
│   │   ├── dateFormat.ts    # Date formatting
│   │   └── fileUtils.ts     # Import/export functions
│   ├── types/               # TypeScript definitions
│   └── App.tsx              # Main app component
├── .github/workflows/       # GitHub Actions
└── public/                  # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Privacy Notice

Journalon is designed with privacy in mind:
- No data collection or tracking
- No external API calls
- All data remains on your device
- No cookies or local storage beyond IndexedDB for app functionality
