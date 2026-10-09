import { 
    doc, 
    setDoc, 
    getDoc, 
    getDocs,
    updateDoc, 
    arrayUnion,
    serverTimestamp,
    collection
} from "firebase/firestore";
import { 
    ref, 
    uploadString, 
    getDownloadURL,
    uploadBytes
} from "firebase/storage";

import { db, storage } from "./firebaseConfig";
import { StudentProgress, Achievements, Achievement, UserProfile } from "../types";

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

// --- Achievements & Storage ---

export const uploadAchievementImage = async (userId: string, milestone: number, base64Image: string): Promise<string> => {
    const storageRef = ref(storage, `users/${userId}/achievements/${milestone}.png`);
    try {
        await uploadString(storageRef, base64Image, 'base64');
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading achievement image:", error);
        throw error;
    }
};

export const uploadAchievementAudio = async (userId: string, milestone: number, wavBase64: string): Promise<string> => {
    const storageRef = ref(storage, `users/${userId}/achievements/${milestone}.wav`);
    try {
        await uploadString(storageRef, wavBase64, 'base64', { contentType: 'audio/wav' });
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Error uploading achievement audio:", error);
        throw error;
    }
};

export const saveAchievementMetadata = async (userId: string, achievement: Achievement) => {
    const achievementRef = doc(db, "users", userId, "achievements", String(achievement.milestone));
    try {
        await setDoc(achievementRef, {
            ...achievement,
            unlockedAt: serverTimestamp()
        });
        
        // Use setDoc with merge for profile updates during achievements to avoid failure if doc was just deleted
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, {
            totalExercisesCompleted: achievement.milestone
        }, { merge: true });
    } catch (error) {
        console.error("Error saving achievement metadata:", error);
        throw error;
    }
};

export const fetchAchievements = async (userId: string): Promise<Achievements> => {
    const achievements: Achievements = {};
    const achievementsRef = collection(db, "users", userId, "achievements");
    try {
        const querySnapshot = await getDocs(achievementsRef);
        querySnapshot.forEach((doc) => {
            const data = doc.data() as Achievement;
            achievements[data.milestone] = data;
        });
        return achievements;
    } catch (error) {
        console.error("Error fetching achievements:", error);
        return achievements;
    }
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
        console.log(`Syncing profile for user ${userId}...`);
        
        // Firestore doesn't accept undefined values. Clean the object.
        const cleanProfile = Object.fromEntries(
            Object.entries(profile).filter(([_, v]) => v !== undefined)
        );

        await setDoc(userRef, {
            ...cleanProfile,
            lastLogin: serverTimestamp()
        }, { merge: true });
        console.log(`Profile synced successfully for ${userId}`);
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
