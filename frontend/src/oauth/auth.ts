// oauth/auth.ts
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const googleId = user.uid;

  const response = await axios.post("/api/users/check-user", {
    u_id: googleId,
  });

  const data = response.data as { exists: boolean };
  
  if (data.exists) {
    const userInfo = await axios.get(`/api/users/${googleId}`);
    return userInfo.data; // return user data
  } else {
    return null; // user doesn't exist, ask to sign up
  }
};

export const signupWithGoogle = async (type: "researcher" | "regular") => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const googleId = user.uid;

  const checkResponse = await axios.post("/api/users/check-user", {
    u_id: googleId,
  });

  const checkData = checkResponse.data as { exists: boolean };
  if (checkData.exists) {
    throw new Error("already_registered");
  }

  const createResponse = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      u_id: user.uid,
      u_name: "",
      u_email: user.email,
      u_role: type,
    }),
  });

  if (!createResponse.ok) {
    throw new Error("failed_to_create_user");
  }

  const userData = await createResponse.json();
  return userData.data; // return newly created user data
};

export const logout = async () => {
  await auth.signOut();
  localStorage.removeItem("user");
  sessionStorage.clear();
};
