import type { ExportedJournal } from '../types';

export function downloadJournalAsJson(journal: ExportedJournal): void {
  const dataStr = JSON.stringify(journal, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `journal-${journal.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function uploadJsonFile(): Promise<ExportedJournal> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const journal = JSON.parse(content) as ExportedJournal;

          // Convert date strings back to Date objects
          journal.createdAt = new Date(journal.createdAt);
          journal.modifiedAt = new Date(journal.modifiedAt);
          journal.entries.forEach(entry => {
            entry.timestamp = new Date(entry.timestamp);
          });

          resolve(journal);
        } catch (error) {
          reject(new Error(`Invalid JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };

    input.click();
  });
}
