import { doc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export interface Song {
  id?: string;
  title: string;
  key: string;
  style: string;
  notes: string;
  tags: string[];
  createdAt?: number;
  updatedAt?: number;
}

function songsRef(uid: string) {
  return collection(db, 'users', uid, 'songs');
}

export async function loadSongs(uid: string): Promise<Song[]> {
  try {
    const snap = await getDocs(songsRef(uid));
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Song, 'id'>) }));
  } catch {
    return [];
  }
}

export async function addSong(uid: string, song: Omit<Song, 'id'>): Promise<Song> {
  const ref = await addDoc(songsRef(uid), { ...song, createdAt: Date.now(), updatedAt: Date.now() });
  return { id: ref.id, ...song };
}

export async function updateSong(uid: string, songId: string, updates: Partial<Song>): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid, 'songs', songId), { ...updates, updatedAt: Date.now() });
  } catch {
    // fail silently
  }
}

export async function deleteSong(uid: string, songId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid, 'songs', songId));
  } catch {
    // fail silently
  }
}
