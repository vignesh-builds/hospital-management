import {
  API,
  getToken,
  getAuthHeaders,
  logout,
} from "./auth";


// ==========================================================
// COMMON API REQUEST
// ==========================================================

export const apiRequest = async (
  endpoint,
  options = {}
) => {

  const token = getToken();


  // ========================================================
  // HEADERS
  // ========================================================

  const headers = {
    ...(options.body
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options.headers || {}),
  };


  // ========================================================
  // ADD JWT TOKEN
  // ========================================================

  if (token) {

    headers.Authorization =
      `Bearer ${token}`;
  }


  // ========================================================
  // REQUEST
  // ========================================================

  let response;

  try {

    response = await fetch(
      `${API}${endpoint}`,
      {
        ...options,
        headers,
      }
    );

  } catch (error) {

    console.error(
      "Network error:",
      error
    );

    throw new Error(
      "Unable to connect to server."
    );
  }


  // ========================================================
  // READ RESPONSE
  // ========================================================

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


  // ========================================================
  // 401 - UNAUTHORIZED
  // ========================================================

  if (response.status === 401) {

    logout();

    window.location.href =
      "/login";

    throw new Error(
      "Session expired. Please login again."
    );
  }


  // ========================================================
  // 403 - FORBIDDEN
  // ========================================================

  if (response.status === 403) {

    console.error(
      "403 Forbidden:",
      endpoint,
      data
    );

    throw new Error(
      "You are not authorized to perform this action."
    );
  }


  // ========================================================
  // OTHER ERRORS
  // ========================================================

  if (!response.ok) {

    const message =
      typeof data === "object" &&
      data?.message

        ? data.message

        : typeof data === "string"

        ? data

        : `Request failed (${response.status})`;


    throw new Error(message);
  }


  // ========================================================
  // SUCCESS
  // ========================================================

  return data;
};
