// Creates a column definition with the given info, then calls onSuccess with the response data
export async function createColumnDefinition(
  fileTypeId,
  columns,
  authToken,
) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/columndefinitions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        fileTypeId: fileTypeId,
        columns: columns,
      }),
    });

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error creating column definition", error };
  }
}

// Updates a column definition with the given info, then calls onSuccess with the response data
export async function updateColumnDefinition(
  columnDefId,
  columns,
  authToken,
) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/columndefinitions/${columnDefId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        columns: columns,
      }),
    });

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error creating column definition", error };
  }
}

// Gets a column definition with the given ID
export async function getColumnDefinition(columnDefId, authToken) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/columndefinitions/${columnDefId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    });

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error getting column definition", error };
  }
}

// Deletes a column definition with the given ID
export function deleteColumnDefinition(columnDefId, authToken, onSuccess) {
  return fetch(
    `${import.meta.env.BASE_URL}/api/columndefinitions/${columnDefId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    }
  )
    .then(async (response) => {
      const data = await response.json();
      data.httpStatus = response.status;
      onSuccess(data);
    })
    .catch((err) => {
      console.log(err);
    });
}

// Creates a column with the given info, then calls onSuccess with the response data
export async function createColumn(
  columnDefId,
  name,
  description,
  dataType,
  transform,
  authToken,
) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/columndefinitions/${columnDefId}/columns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        name: name,
        description: description,
        dataType: dataType,
        transform: transform,
      }),
    });

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error creating file type", error };
  }
}

// Updates a column with the given info, then calls onSuccess with the response data
export async function updateColumn(
  columnDefId,
  columnId,
  name,
  description,
  dataType,
  transform,
  authToken,
) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/columndefinitions/${columnDefId}/columns/${columnId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        name: name,
        description: description,
        dataType: dataType,
        transform: transform,
      }),
    });

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error creating file type", error };
  }
}

// Gets a column with the given ID
export function getColumn(columnDefId, columnId, authToken, onSuccess) {
  return fetch(
    `${import.meta.env.BASE_URL}/api/columndefinitions/${columnDefId}/columns/${columnId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    }
  )
    .then(async (response) => {
      const data = await response.json();
      data.httpStatus = response.status;
      onSuccess(data);
    })
    .catch((err) => {
      console.log(err);
    });
}

// Deletes a column with the given ID
export async function deleteColumn(
  columnDefId, 
  columnId, 
  authToken, 
) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}/api/columndefinitions/${columnDefId}/columns/${columnId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
    });

    const data = await response.json();
    data.httpStatus = response.status;
    return data;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error deleting column", error };
  }
}