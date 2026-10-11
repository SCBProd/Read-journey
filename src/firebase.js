import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyD0_6ccCa_B_aAARjN4A2B5CaHYi302BHk",
  authDomain: "firstfirebase-8af71.firebaseapp.com",
  databaseURL:
    "https://firstfirebase-8af71-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "firstfirebase-8af71",
  storageBucket: "firstfirebase-8af71.firebasestorage.app",
  messagingSenderId: "565059558496",
  appId: "1:565059558496:web:f92e0cb3c62f3249da7705",
  measurementId: "G-87KSC6XTK8",
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

let analyticsPromise;

export function getFirebaseAnalytics() {
  if (typeof window === "undefined") return Promise.resolve(null);

  analyticsPromise ??= import("firebase/analytics").then(
    async ({ getAnalytics, isSupported }) => {
      return (await isSupported()) ? getAnalytics(firebaseApp) : null;
    },
  );

  return analyticsPromise;
}
