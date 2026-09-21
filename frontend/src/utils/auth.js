const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";


export const API = API_URL;


export const getToken = () => {
  return localStorage.getItem("token");
};


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
      role: data.role,
    })
  );
};


export const logout = () => {

  localStorage.removeItem("token");

  localStorage.removeItem("user");
};


export const isLoggedIn = () => {

  return !!getToken();
};


export const getAuthHeaders = () => {

  const token = getToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};