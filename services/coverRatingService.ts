import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, type User } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore, increment, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import mainApp from './firebaseConfig';

export const TOTAL_COVERS = 107;

export interface CoverRatingSummary {
  count: number;
  sum: number;
  average: number;
}

// A separate Auth instance keeps a visitor's vote independent of the portal login.
const ratingApp = getApps().find(app => app.name === 'statai-cover-ratings')
  ?? initializeApp(mainApp.options, 'statai-cover-ratings');
const visitorAuth = getAuth(ratingApp);
const ratingDb = getFirestore(ratingApp);
let visitorRequest: Promise<User> | undefined;

export const getCoverId = (coverNumber: number): string => {
  if (!Number.isInteger(coverNumber) || coverNumber < 1 || coverNumber > TOTAL_COVERS) {
    throw new Error('Capa inválida.');
  }
  return 'capa-' + String(coverNumber).padStart(3, '0');
};

const readSummary = (data?: Record<string, unknown>): CoverRatingSummary => {
  if (!data) return { count: 0, sum: 0, average: 0 };
  const count = data.count;
  const sum = data.sum;
  if (!Number.isSafeInteger(count) || !Number.isSafeInteger(sum) || Number(count) < 1
      || Number(sum) < Number(count) || Number(sum) > Number(count) * 5) {
    throw new Error('Não foi possível ler a média desta capa.');
  }
  return { count: Number(count), sum: Number(sum), average: Number(sum) / Number(count) };
};

const getVisitor = async (): Promise<User> => {
  await visitorAuth.authStateReady();
  if (visitorAuth.currentUser) return visitorAuth.currentUser;
  if (!visitorRequest) {
    visitorRequest = signInAnonymously(visitorAuth)
      .then(result => result.user)
      .finally(() => { visitorRequest = undefined; });
  }
  return visitorRequest;
};

export const loadOwnCoverRating = async (coverNumber: number): Promise<number> => {
  const coverId = getCoverId(coverNumber);
  await visitorAuth.authStateReady();
  const user = visitorAuth.currentUser;
  if (!user) return 0;
  const vote = await getDocFromServer(doc(ratingDb, 'coverRatings', coverId, 'votes', user.uid));
  return vote.exists() ? vote.data().score : 0;
};

export const subscribeCoverRating = (
  coverNumber: number,
  onChange: (summary: CoverRatingSummary) => void,
  onError: (error: Error) => void
): (() => void) => onSnapshot(
  doc(ratingDb, 'coverRatings', getCoverId(coverNumber)),
  { includeMetadataChanges: true },
  snapshot => {
    if (snapshot.metadata.hasPendingWrites) return;
    try { onChange(readSummary(snapshot.exists() ? snapshot.data() : undefined)); }
    catch (error) { onError(error instanceof Error ? error : new Error('Média indisponível.')); }
  },
  onError
);

export const saveCoverRating = async (coverNumber: number, score: number): Promise<CoverRatingSummary> => {
  const coverId = getCoverId(coverNumber);
  if (!Number.isInteger(score) || score < 1 || score > 5) throw new Error('Escolha uma nota de 1 a 5.');
  const visitor = await getVisitor();
  const summaryRef = doc(ratingDb, 'coverRatings', coverId);
  const voteRef = doc(summaryRef, 'votes', visitor.uid);

  const commitVote = () => runTransaction(ratingDb, async transaction => {
    const [summarySnapshot, voteSnapshot] = await Promise.all([
      transaction.get(summaryRef),
      transaction.get(voteRef),
    ]);
    const summary = readSummary(summarySnapshot.exists() ? summarySnapshot.data() : undefined);
    const previousScore = voteSnapshot.exists() ? voteSnapshot.data().score : 0;
    if (previousScore === score) return summary;

    const count = summary.count + (voteSnapshot.exists() ? 0 : 1);
    const sum = summary.sum - previousScore + score;
    transaction.set(voteRef, { score, updatedAt: serverTimestamp() });
    // Server increments remain valid when another visitor commits during rule evaluation.
    transaction.set(summaryRef, {
      count: increment(voteSnapshot.exists() ? 0 : 1),
      sum: increment(score - previousScore),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { count, sum, average: sum / count };
  });

  // The same visitor can also update from two tabs. Re-read after a rule conflict.
  for (let attempt = 0; ; attempt += 1) {
    try { return await commitVote(); }
    catch (error) {
      if (attempt >= 2 || (error as { code?: string }).code !== 'permission-denied') throw error;
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
};
