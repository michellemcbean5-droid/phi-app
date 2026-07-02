import * as FileSystem from 'expo-file-system';
import { create } from 'zustand';

export interface GloveboxDoc {
  id: string;
  name: string;
  type: 'BOL' | 'POD' | 'Insurance' | 'Registration' | 'IFTA' | 'Permit' | 'Rate Con';
  status: 'Current' | 'Pending Review' | 'Archived' | 'Expiring Soon';
  date: string;
  uri: string;
}

const DOCS_DIR = `${FileSystem.documentDirectory}phi_documents/`;
const INDEX_FILE = `${DOCS_DIR}index.json`;

const ensureDir = async (): Promise<void> => {
  const info = await FileSystem.getInfoAsync(DOCS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOCS_DIR, { intermediates: true });
  }
};

const writeIndex = async (documents: GloveboxDoc[]): Promise<void> => {
  await FileSystem.writeAsStringAsync(INDEX_FILE, JSON.stringify(documents));
};

interface DocumentsState {
  documents: GloveboxDoc[];
  loaded: boolean;
  loadDocuments: () => Promise<void>;
  addDocument: (type: GloveboxDoc['type'], name: string, sourceUri: string) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
}

const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  loaded: false,

  loadDocuments: async () => {
    try {
      await ensureDir();
      const info = await FileSystem.getInfoAsync(INDEX_FILE);
      if (info.exists) {
        const raw = await FileSystem.readAsStringAsync(INDEX_FILE);
        set({ documents: JSON.parse(raw) as GloveboxDoc[], loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  addDocument: async (type, name, sourceUri) => {
    await ensureDir();
    const id = `${Date.now()}`;
    const extension = sourceUri.split('.').pop() ?? 'jpg';
    const destUri = `${DOCS_DIR}${id}.${extension}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });

    const newDoc: GloveboxDoc = {
      id,
      name,
      type,
      status: 'Current',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      uri: destUri,
    };

    const updated = [newDoc, ...get().documents];
    set({ documents: updated });
    await writeIndex(updated);
  },

  removeDocument: async (id) => {
    const target = get().documents.find((d) => d.id === id);
    const updated = get().documents.filter((d) => d.id !== id);
    set({ documents: updated });
    await writeIndex(updated);
    if (target) {
      try {
        await FileSystem.deleteAsync(target.uri, { idempotent: true });
      } catch {
        // Ignore
      }
    }
  },
}));

export default useDocumentsStore;
