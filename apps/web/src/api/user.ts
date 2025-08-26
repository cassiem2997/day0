// src/api/user.ts
import api from "./axiosInstance";

export type Gender = "MALE" | "FEMALE";

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  nickname: string;
  gender: Gender;
  birth: string;
  homeUniversityId: number;
  destUniversityId: number;
}

export async function signUp(user: SignUpPayload, profileImage?: File | Blob) {
  const formData = new FormData();

  const userBlob = new Blob([JSON.stringify(user)], {
    type: "application/json",
  });
  formData.append("user", userBlob);

  if (profileImage) {
    formData.append("profileImage", profileImage);
  }

  const res = await api.post("/auth/register", formData);
  return res.data;
}
