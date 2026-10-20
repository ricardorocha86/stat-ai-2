import { doc, getDocFromServer, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { createGameSaveSession, type GameSave, type GameSaveStatus } from './gameSaveSession';

export function loadSigmaGameSession(userId: string, onStatus: (status: GameSaveStatus) => void) {
  // Existing /users/{uid}/** rules restrict both reads and writes to this account.
  const saveRef = doc(db, 'users', userId, 'games', 'lenda-de-sigma');
  return createGameSaveSession({
    userId,
    onStatus,
    storage: {
      getItem: key => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    },
    read: async () => {
      const snapshot = await getDocFromServer(saveRef);
      return snapshot.exists() ? snapshot.data() as GameSave : null;
    },
    // Keep the native save as JSON: it contains arrays and dynamic nested flags.
    write: save => setDoc(saveRef, { ...save, updatedAt: serverTimestamp() }),
  });
}
