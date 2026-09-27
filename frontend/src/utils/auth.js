const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";

export const API = API_URL;


// ==============================
// GET TOKEN
// ==============================

export const getToken = () => {
  return localStorage.getItem("token");
};


// ==============================
// GET USER
// ==============================

export const getUser = () => {
  const user = localStorage.getItem("user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    console.log("Invalid user data:", error);
    return null;
  }
};


// ==============================
// SAVE LOGIN DATA
// ==============================

export const saveAuth = (data) => {
  localStorage.setItem("token", data.token);

  localStorage.setItem(
    "user",
    JSON.stringify({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
    })
  );
};


// ==============================
// LOGOUT
// ==============================

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};


// ==============================
// CHECK LOGIN
// ==============================

export const isLoggedIn = () => {
  const token = getToken();

  return token !== null && token !== "";
};


// ==============================
// AUTH HEADERS
// ==============================

export const getAuthHeaders = () => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: token
      ? `Bearer ${token}`
      : "",
  };
};
