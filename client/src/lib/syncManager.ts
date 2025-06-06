import { localStorage } from './localStorage';
import { firebaseSync } from './firebase';
import type { LocalNote } from '@shared/schema';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export class SyncManager {
  private syncInProgress = false;
  private autoSyncInterval: NodeJS.Timeout | null = null;
  private onStatusChange?: (status: SyncStatus) => void;

  constructor() {
    this.startAutoSync();
  }

  setStatusCallback(callback: (status: SyncStatus) => void) {
    this.onStatusChange = callback;
  }

  private updateStatus(status: SyncStatus) {
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  async performSync(): Promise<boolean> {
    if (this.syncInProgress) return false;
    
    this.syncInProgress = true;
    this.updateStatus('syncing');

    try {
      const isFirebaseAvailable = await firebaseSync.isAvailable();
      
      if (!isFirebaseAvailable) {
        this.updateStatus('offline');
        return false;
      }

      // Get local notes
      const localNotes = localStorage.getNotes();
      
      // Get Firebase notes
      const firebaseNotes = await firebaseSync.syncFromFirebase();
      
      // Merge notes (simple last-updated-wins strategy)
      const mergedNotes = this.mergeNotes(localNotes, firebaseNotes);
      
      // Save merged notes locally
      localStorage.saveNotes(mergedNotes);
      
      // Sync local changes to Firebase
      const unsyncedNotes = mergedNotes.filter(note => 
        !note.lastSyncedAt || 
        new Date(note.updatedAt) > new Date(note.lastSyncedAt)
      );
      
      if (unsyncedNotes.length > 0) {
        await firebaseSync.syncToFirebase(unsyncedNotes);
        
        // Update lastSyncedAt for synced notes
        const now = new Date().toISOString();
        unsyncedNotes.forEach(note => {
          note.lastSyncedAt = now;
        });
        localStorage.saveNotes(mergedNotes);
      }

      this.updateStatus('synced');
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      this.updateStatus('error');
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  private mergeNotes(localNotes: LocalNote[], firebaseNotes: LocalNote[]): LocalNote[] {
    const mergedMap = new Map<string, LocalNote>();
    
    // Add all local notes
    localNotes.forEach(note => {
      mergedMap.set(note.id, note);
    });
    
    // Merge with Firebase notes (last updated wins)
    firebaseNotes.forEach(firebaseNote => {
      const localNote = mergedMap.get(firebaseNote.id);
      
      if (!localNote) {
        // New note from Firebase
        mergedMap.set(firebaseNote.id, firebaseNote);
      } else {
        // Conflict resolution: use most recently updated
        const localUpdated = new Date(localNote.updatedAt);
        const firebaseUpdated = new Date(firebaseNote.updatedAt);
        
        if (firebaseUpdated > localUpdated) {
          mergedMap.set(firebaseNote.id, firebaseNote);
        }
      }
    });
    
    return Array.from(mergedMap.values());
  }

  startAutoSync(intervalMs = 30000) { // 30 seconds
    this.stopAutoSync();
    
    this.autoSyncInterval = setInterval(async () => {
      if (!this.syncInProgress) {
        await this.performSync();
      }
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }

  async manualSync(): Promise<boolean> {
    return await this.performSync();
  }
}

export const syncManager = new SyncManager();
