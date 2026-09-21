import {
  API,
  getAuthHeaders,
  logout,
} from "./auth";


export const apiRequest = async (
  endpoint,
  options = {}
) => {

  const token =
    localStorage.getItem("token");


  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };


  if (!token) {

    delete headers.Authorization;
  }


  const response = await fetch(
    `${API}${endpoint}`,
    {
      ...options,
      headers,
    }
  );


  const text =
    await response.text();


  let data = null;


  if (text) {

    try {

      data = JSON.parse(text);

    } catch {

      data = text;
    }
  }


  // JWT expired / unauthorized
  if (response.status === 401) {

    logout();

    window.location.href =
      "/login";

    throw new Error(
      "Session expired. Please login again."
    );
  }


  // Forbidden
  if (response.status === 403) {

    throw new Error(
      "You are not authorized to perform this action."
    );
  }


  if (!response.ok) {

    const message =
      typeof data === "object" &&
      data?.message

        ? data.message

        : typeof data === "string"

        ? data

        : "Request failed";


    throw new Error(message);
  }


  return data;
};