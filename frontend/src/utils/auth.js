const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";


export const API = API_URL;


// =====================================================
// GET TOKEN
// =====================================================

export const getToken = () => {

  return localStorage.getItem("token");
};


// =====================================================
// GET USER
// =====================================================

export const getUser = () => {

  const user =
    localStorage.getItem("user");


  if (!user) {
    return null;
  }


  try {

    return JSON.parse(user);

  } catch {

    return null;
  }
};


// =====================================================
// SAVE AUTH
// =====================================================

export const saveAuth = (data) => {

  localStorage.setItem(
    "token",
    data.token
  );


  localStorage.setItem(
    "user",

    JSON.stringify({

      id: data.id,

      name: data.name,

      email: data.email,

      role: data.role

    })
  );
};


// =====================================================
// LOGOUT
// =====================================================

export const logout = () => {

  localStorage.removeItem("token");

  localStorage.removeItem("user");
};


// =====================================================
// LOGIN CHECK
// =====================================================

export const isLoggedIn = () => {

  return !!getToken();
};


// =====================================================
// AUTH HEADERS
// =====================================================

export const getAuthHeaders = () => {

  const token = getToken();


  const headers = {

    "Content-Type": "application/json"

  };


  if (token) {

    headers.Authorization =
      `Bearer ${token}`;

  }


  return headers;
};
