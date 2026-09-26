import "./patients.css";
import { useEffect, useState } from "react";

const API_URL = "https://hospital-backend-jcnb.onrender.com";

function Patients() {
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");

  const [editingPatient, setEditingPatient] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==============================
  // GET USER
  // ==============================
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Invalid user data:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  // ==============================
  // GET ALL PATIENTS
  // ==============================
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      return;
    }

    fetch(`${API_URL}/patients`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        const text = await response.text();

        let data;

        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }

        if (!response.ok) {
          throw new Error(
            typeof data === "string"
              ? data
              : data.message || "Failed to fetch patients"
          );
        }

        return data;
      })
      .then((data) => {
        setPatients(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Fetch patients error:", error);
        setError(error.message);
      });
  }, []);

  // ==============================
  // CREATE PATIENT
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/patients`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: name,
          email: email,
          phone: phone,
          age: Number(age),
        }),
      });

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data.message || "Failed to add patient"
        );
      }

      setPatients((prevPatients) => [
        ...prevPatients,
        data,
      ]);

      setName("");
      setEmail("");
      setPhone("");
      setAge("");

    } catch (error) {
      console.error("Add patient error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // DELETE PATIENT
  // ==============================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this patient?"
    );

    if (!confirmDelete) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/patients/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          text || "Failed to delete patient"
        );
      }

      setPatients((prevPatients) =>
        prevPatients.filter(
          (patient) => patient.id !== id
        )
      );

    } catch (error) {
      console.error("Delete patient error:", error);
      setError(error.message);
    }
  };

  // ==============================
  // SELECT PATIENT FOR EDIT
  // ==============================
  const handleEdit = (id) => {
    const patient = patients.find(
      (patient) => patient.id === id
    );

    if (patient) {
      setEditingPatient({
        ...patient,
      });
    }
  };

  // ==============================
  // UPDATE PATIENT
  // ==============================
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingPatient) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login first.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/patients/${editingPatient.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: editingPatient.name,
            email: editingPatient.email,
            phone: editingPatient.phone,
            age: Number(editingPatient.age),
          }),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data.message || "Failed to update patient"
        );
      }

      setPatients((prevPatients) =>
        prevPatients.map((patient) =>
          patient.id === data.id
            ? data
            : patient
        )
      );

      setEditingPatient(null);

    } catch (error) {
      console.error("Update patient error:", error);
      setError(error.message);
    }
  };

  // ==============================
  // CANCEL EDIT
  // ==============================
  const handleCancelEdit = () => {
    setEditingPatient(null);
  };

  return (
    <div className="patients-page">

      <h1>Patients</h1>

      {/* ERROR */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ==============================
          ADMIN - ADD PATIENT
          ============================== */}

      {user?.role === "ADMIN" && (
        <form
          className="patient-form"
          onSubmit={handleSubmit}
        >

          <input
            type="text"
            placeholder="Patient Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            required
          />

          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) =>
              setAge(e.target.value)
            }
            min="1"
            max="120"
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Adding..."
              : "Add Patient"}
          </button>

        </form>
      )}

      {/* ==============================
          PATIENT LIST
          ============================== */}

      <div className="patients-list">

        {patients.length === 0 ? (
          <p>No patients found.</p>
        ) : (
          patients.map((patient) => (

            <div
              className="patient-card"
              key={patient.id}
            >

              <h2>
                {patient.name}
              </h2>

              <p>
                <strong>Email:</strong>{" "}
                {patient.email}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {patient.phone}
              </p>

              <p>
                <strong>Age:</strong>{" "}
                {patient.age}
              </p>

              {/* ==============================
                  ADMIN ACTIONS
                  ============================== */}

              {user?.role === "ADMIN" && (
                <div className="patient-actions">

                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(patient.id)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(patient.id)
                    }
                  >
                    Delete
                  </button>

                </div>
              )}

              {/* ==============================
                  EDIT FORM
                  ============================== */}

              {user?.role === "ADMIN" &&
                editingPatient?.id === patient.id && (

                  <form
                    className="edit-patient-form"
                    onSubmit={handleUpdate}
                  >

                    <input
                      type="text"
                      value={
                        editingPatient.name
                      }
                      onChange={(e) =>
                        setEditingPatient({
                          ...editingPatient,
                          name: e.target.value,
                        })
                      }
                      required
                    />

                    <input
                      type="email"
                      value={
                        editingPatient.email
                      }
                      onChange={(e) =>
                        setEditingPatient({
                          ...editingPatient,
                          email: e.target.value,
                        })
                      }
                      required
                    />

                    <input
                      type="text"
                      value={
                        editingPatient.phone
                      }
                      onChange={(e) =>
                        setEditingPatient({
                          ...editingPatient,
                          phone: e.target.value,
                        })
                      }
                      required
                    />

                    <input
                      type="number"
                      value={
                        editingPatient.age
                      }
                      onChange={(e) =>
                        setEditingPatient({
                          ...editingPatient,
                          age: e.target.value,
                        })
                      }
                      min="1"
                      max="120"
                      required
                    />

                    <button type="submit">
                      Update Patient
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>

                  </form>
                )}

            </div>

          ))
        )}

      </div>

    </div>
  );
}

export default Patients;
