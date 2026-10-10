import { 
    doc, 
    setDoc, 
    getDoc, 
    getDocs,
    updateDoc, 
    arrayUnion,
    serverTimestamp,
    collection,
    query,
    where,
    QueryDocumentSnapshot
} from "firebase/firestore";
import { 
    ref, 
    uploadString, 
    getDownloadURL,
    uploadBytes
} from "firebase/storage";

import { db, storage } from "./firebaseConfig";
import { StudentProgress, RewardClaim, RewardId, UserProfile } from "../types";

// --- Progress Management ---

export const saveStudentProgress = async (userId: string, lessonId: string, exerciseId: string) => {
    const progressRef = doc(db, "users", userId, "progress", lessonId);
    try {
        const docSnap = await getDoc(progressRef);
        if (docSnap.exists()) {
            await updateDoc(progressRef, {
                completedExerciseIds: arrayUnion(exerciseId),
                lastAccessedAt: serverTimestamp()
            });
        } else {
            await setDoc(progressRef, {
                completedExerciseIds: [exerciseId],
                lastAccessedAt: serverTimestamp(),
                status: "em_progresso"
            });
        }
    } catch (error) {
        console.error("Error saving student progress:", error);
        throw error;
    }
};

export const fetchStudentProgress = async (userId: string): Promise<StudentProgress> => {
    const progress: StudentProgress = {};
    const progressRef = collection(db, "users", userId, "progress");
    try {
        const querySnapshot = await getDocs(progressRef);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const lessonId = doc.id;
            const completedExerciseIds = data.completedExerciseIds || [];
            progress[lessonId] = new Set(completedExerciseIds);
        });
        return progress;
    } catch (error) {
        console.error("Error fetching student progress:", error);
        return progress;
    }
};

// --- Rewards ---

// One document per opened prize, id "<uid>_<rewardId>". Students only create their own;
// the professor lists them all and marks physical prizes as delivered.
const toRewardClaim = (snapshot: QueryDocumentSnapshot): RewardClaim => {
    const data = snapshot.data();
    return {
        id: snapshot.id,
        uid: data.uid,
        rewardId: data.rewardId,
        name: data.name,
        email: data.email,
        userType: data.userType,
        openedAt: data.openedAt?.toDate(),
        delivered: Boolean(data.delivered),
    };
};

export const fetchOpenedRewards = async (userId: string): Promise<Set<RewardId>> => {
    const snapshot = await getDocs(query(collection(db, "rewardClaims"), where("uid", "==", userId)));
    return new Set(snapshot.docs.map(claim => claim.data().rewardId as RewardId));
};

export const saveRewardClaim = async (userId: string, rewardId: RewardId, profile: UserProfile) => {
    const claim: Record<string, unknown> = {
        uid: userId,
        rewardId,
        name: profile.name,
        openedAt: serverTimestamp(),
        delivered: false,
    };
    if (profile.email) claim.email = profile.email;
    if (profile.userType) claim.userType = profile.userType;
    await setDoc(doc(db, "rewardClaims", `${userId}_${rewardId}`), claim);
};

export const fetchAllRewardClaims = async (): Promise<RewardClaim[]> => {
    const snapshot = await getDocs(collection(db, "rewardClaims"));
    return snapshot.docs.map(toRewardClaim);
};

export const setRewardClaimDelivered = async (claimId: string, delivered: boolean) => {
    await updateDoc(doc(db, "rewardClaims", claimId), { delivered, deliveredAt: serverTimestamp() });
};

// --- User Profile ---

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }
    return null;
};

export const syncUserProfile = async (userId: string, profile: UserProfile) => {
    const userRef = doc(db, "users", userId);
    try {
        
        // Firestore doesn't accept undefined values. Clean the object.
        const cleanProfile = Object.fromEntries(
            Object.entries(profile).filter(([_, v]) => v !== undefined)
        );

        await setDoc(userRef, {
            ...cleanProfile,
            lastLogin: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error syncing user profile:", error);
        throw error; // Throwing so App.tsx knows it failed
    }
};

export const uploadProfilePicture = async (userId: string, file: File | string): Promise<string> => {
    const storageRef = ref(storage, `users/${userId}/profile_picture.png`);
    try {
        if (typeof file === 'string') {
            await uploadString(storageRef, file, 'data_url');
        } else {
             await uploadBytes(storageRef, file);
        }
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        throw error;
    }
};

export const saveLastLesson = async (userId: string, lessonId: string) => {
    await setDoc(doc(db, "users", userId), { lastLessonId: lessonId, lastLessonAt: serverTimestamp() }, { merge: true });
};
