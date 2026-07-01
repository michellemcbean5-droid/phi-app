import { Directory, File, Paths } from 'expo-file-system';
import { create } from 'zustand';

export interface GloveboxDoc {
  id: string;
  name: string;
  type: 'BOL' | 'POD' | 'Insurance' | 'Registration' | 'IFTA' | 'Permit' | 'Rate Con';
  status: 'Current' | 'Pending Review' | 'Archived' | 'Expiring Soon';
  date: string;
  uri: string;
}

const docsDir = new Directory(Paths.document, 'phi_documents');
const indexFile = new File(docsDir, 'index.json');

const ensureDir = (): void => {
  if (!docsDir.exists) {
    docsDir.create({ intermediates: true });
  }
};

const writeIndex = (documents: GloveboxDoc[]): void => {
  indexFile.write(JSON.stringify(documents));
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
      ensureDir();
      if (indexFile.exists) {
        const raw = await indexFile.text();
        set({ documents: JSON.parse(raw) as GloveboxDoc[], loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  addDocument: async (type, name, sourceUri) => {
    ensureDir();
    const id = `${Date.now()}`;
    const extension = sourceUri.split('.').pop() ?? 'jpg';
    const destFile = new File(docsDir, `${id}.${extension}`);
    new File(sourceUri).copy(destFile);

    const newDoc: GloveboxDoc = {
      id,
      name,
      type,
      status: 'Current',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      uri: destFile.uri,
    };

    const updated = [newDoc, ...get().documents];
    set({ documents: updated });
    writeIndex(updated);
  },

  removeDocument: async (id) => {
    const target = get().documents.find((d) => d.id === id);
    const updated = get().documents.filter((d) => d.id !== id);
    set({ documents: updated });
    writeIndex(updated);
    if (target) {
      try {
        new File(target.uri).delete();
      } catch {
        // Ignore
      }
    }
  },
}));

export default useDocumentsStore;
