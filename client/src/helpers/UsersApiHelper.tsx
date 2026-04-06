import axios from "axios";

// Dispatches a request to get the admin status of a user; returns the response json.
export function getAdminStatus(userid: string, authToken: string) {
  return fetch(`${import.meta.env.BASE_URL}/api/users/${userid}/checkadmin`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken,
    },
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})); // Handle cases where no JSON is returned
        throw {
          status: res.status,
          message: errorData.message || "An error occurred",
        };
      }
      return res.json();
    })
    .catch((err) => {
      console.error("Error fetching admin status:", err);
      throw err; // Re-throw the error to be handled by the caller
    });
}

// Dispatches a request to get all users; returns the response json.
export function getAllUsers(authToken: string) {
  return fetch(`${import.meta.env.BASE_URL}/api/users/getallusers`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken,
    },
  })
    .then((res) => res.json())
    .catch((err) => {
      console.log(err);
    });
}

// Gets users by search criteria
export async function getUsersBySearch(
  searchCriteria: string,
  authToken: string,
) {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}/api/users?search=${searchCriteria}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      },
    );
    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error("Error searching users: ", error);
    return error;
  }
}

// Dispatches a request to delete a user; returns the response json.
export function deleteUser(
  activeUserId: string,
  userId: string,
  authToken: string,
) {
  return fetch(`${import.meta.env.BASE_URL}/api/users/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken,
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        console.log(res);
      } else {
        // throw error
        throw res;
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

// Dispatches a request to log out a user; returns the response json.
export function logoutUser(authToken: string) {
  return fetch(`${import.meta.env.BASE_URL}/api/users/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken,
    },
  })
    .then((res) => res.json())
    .catch((err) => {
      console.log("Error during logout:", err);
      // Don't throw error - logout should succeed even if API call fails
      return { success: false, error: err };
    });
}

// Dispatches a request to get the status of a user's token; returns the response json.
export function getTokenStatus(userId: string, token: string) {
  return fetch(
    `${import.meta.env.BASE_URL}/api/users/${userId}/checktoken/${token}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
    .then((res) => res.json())
    .catch((err) => {
      console.log(err);
    });
}

// Dispatches a request to reset a user's password; returns the response json.
export function resetPassword(userId: string, password: string, token: string) {
  return fetch(
    `${import.meta.env.BASE_URL}/api/users/${userId}/resetpassword`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        password: password,
        token: token,
      }),
    },
  )
    .then((res) => res.json())
    .catch((err) => {
      throw err;
    });
}

// Dispatches a request to get a user's profile; returns the response json.
export function getUserProfile(authToken: string) {
  return fetch(`${import.meta.env.BASE_URL}/api/users/self`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken,
    },
  })
    .then((res) => {
      if (!res.ok && res.status >= 500) {
        throw new Error("Server Error. Please try reloading the page.");
      }
      return res.json();
    })
    .catch((err) => {
      console.error(err);
      throw err; // Rethrowing the error so it can be caught in the component where getUserProfile is called.
    });
}

// Dispatches a request to update a user's profile; returns the response json.
export function updateUserProfile(
  firstName: string,
  lastName: string,
  email: string,
  institutionId: string,
  labId: string,
  currentPassword: string,
  password: string,
  profileImage: string,
  authToken: string,
  onSuccess: any,
  onError: any,
) {
  return fetch(`${import.meta.env.BASE_URL}/api/users/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken,
    },
    body: JSON.stringify({
      firstName: firstName,
      lastName: lastName,
      email: email,
      institutionId: institutionId,
      labId: labId,
      currentPassword: currentPassword,
      password: password,
      profileImage: profileImage,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res && res.success) {
        onSuccess(res);
      } else {
        // throw error
        onError(res);
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

// Dispatches a request to invite a new user; returns the response json.
export function inviteUser(
  firstName: string,
  lastName: string,
  email: string,
  authToken: string,
) {
  return fetch(`${import.meta.env.BASE_URL}/api/users/invitenewuser`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken,
    },
    body: JSON.stringify({
      firstName: firstName,
      lastName: lastName,
      email: email,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        // user successfully added an experiment, add this to experiment array
        console.log("User invited");
      } else {
        // throw error
        throw res;
      }
    })
    .catch((err) => {
      // experiment not added. Show error message
      console.log(err);
    });
}

// Dispatches a request to get a collaborator; then calls an acting function.
export function getCollaborators(
  experimentId: string,
  authToken: string,
  actingFunction: any,
) {
  fetch(
    `${import.meta.env.BASE_URL}/api/experiments/${experimentId}/collaborators`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    },
  )
    .then((res) => res.json())
    .then((res) => {
      // console.log(res);
      if (res.success) {
        // if succesful set the parent state with the collaborators
        actingFunction(res.collaborators);
      } else throw res;
    })
    .catch((res) => {
      console.log(res);
    });
}

// Dispatches a request to add a collaborator; then calls an acting function.
export function addCollaborator(
  prjId: string,
  email: string,
  authToken: string,
  actingFunction: any,
) {
  // add a new collaborator to the list
  return fetch(
    `${import.meta.env.BASE_URL}/api/experiments/${prjId}/collaborators`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        email: email,
      }),
    },
  )
    .then((res) => res.json())
    .then((res) => {
      // if successful add re-load users from the DB
      actingFunction();
    })
    .then((res: any) => {
      console.log(res);
      if (res && res.success) {
        return res.user;
      } else throw res;
    })
    .catch((res) => {
      console.log(res);
      return null;
    });
}

// Function to verify user email
export function verifyEmailURL(id: string, token: string) {
  return axios
    .patch(`${import.meta.env.BASE_URL}/api/email/${id}/verify/${token}`)
    .then((response) => {
      console.log(response.data);
      return response.data;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

// Function to do setup Dropbox Sync
export function dropboxConnect(userId: string) {
  // Get the environmental variables
  const clientId = import.meta.env.VITE_DROPBOX_CLIENT_ID; // OAuth Client ID provided by Dropbox
  const apiBase = import.meta.env.VITE_BASE_URL; // The Base URL of this application

  // Validation to check if environmental variables exist
  console.log("Client ID: ", clientId);
  console.log("Base URL:", apiBase);
  if (!clientId || !apiBase) {
    console.error("Missing DROPBOX_CLIENT_ID or API_BASE_URL");
    return;
  }
  const redirectUri = `${apiBase}/api/dropbox/callback`; // The URL where Dropbox will redirect the user after authentication
  const state = userId; // A unique identifier (User ID) to prevent Cross-Site Request Forgery (CRSF) attacks

  // Explains what URLSearchParams does: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
  const params = new URLSearchParams({
    response_type: "code", // Requests an authorization code
    client_id: clientId, // Identifies our App in Dropbox. (This is created by the admin)
    redirect_uri: redirectUri, // Tells Dropbox where to send user after approval
    state, // Security token to validate later
  });

  // Window.location.href sets the browser URL to this address and reloads the page.
  // This temporary redirect takes the user to Dropbox authentication page to make sure that the user and web application is authorized to access the Dropbox app.
  // After Authorization, user will be redirected back to  redirectURI which is a callback that does something...?
  window.location.href = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
}

// Function to unlink dropbox by deleting token
export function unlinkDropbox(authToken, actingFunction: any) {
  return fetch(`${import.meta.env.BASE_URL}/api/dropbox/account`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken,
    },
  })
    .then((res) => res.json())
    .then((res) => {
      actingFunction(res);
    })
    .catch((err) => {
      console.log(err);
    });
}
