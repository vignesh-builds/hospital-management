import "./Doctors.css";
import { useEffect, useState } from "react";

const API_URL = "https://hospital-backend-jcnb.onrender.com";

function Doctors() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");

  const [editingDoctor, setEditingDoctor] = useState(null);

  // =========================
  // GET ALL DOCTORS
  // =========================
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/doctors`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch doctors");
        }

        return response.json();
      })
      .then((data) => {
        setDoctors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Fetch doctors error:", error);
        setError(error.message || "Failed to fetch doctors");
        setLoading(false);
      });
  }, []);

  // =========================
  // CREATE DOCTOR
  // =========================
  const handleSubmit = (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    setError("");

    fetch(`${API_URL}/doctors`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        name: name,
        specialization: specialization,
        phone: phone,
      }),
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
              : data?.message || "Failed to add doctor"
          );
        }

        return data;
      })
      .then((data) => {
        console.log("Doctor added:", data);

        setDoctors((prevDoctors) => [
          ...prevDoctors,
          data,
        ]);

        setName("");
        setSpecialization("");
        setPhone("");
      })
      .catch((error) => {
        console.error("Add doctor error:", error);
        setError(error.message || "Failed to add doctor");
      });
  };

  // =========================
  // DELETE DOCTOR
  // =========================
  const handleDelete = (id) => {
    const token = localStorage.getItem("token");

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this doctor?"
    );

    if (!confirmDelete) {
      return;
    }

    setError("");

    fetch(`${API_URL}/doctors/${id}`, {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const text = await response.text();

        if (!response.ok) {
          throw new Error(
            text || "Failed to delete doctor"
          );
        }
      })
      .then(() => {
        console.log("Doctor deleted");

        setDoctors((prevDoctors) =>
          prevDoctors.filter(
            (doctor) => doctor.id !== id
          )
        );
      })
      .catch((error) => {
        console.error("Delete doctor error:", error);
        setError(
          error.message || "Failed to delete doctor"
        );
      });
  };

  // =========================
  // SELECT DOCTOR FOR EDIT
  // =========================
  const handleEdit = (id) => {
    const doctor = doctors.find(
      (doctor) => doctor.id === id
    );

    if (doctor) {
      setEditingDoctor({
        ...doctor,
      });
    }
  };

  // =========================
  // UPDATE DOCTOR
  // =========================
  const handleUpdate = () => {
    if (!editingDoctor) {
      return;
    }

    const token = localStorage.getItem("token");

    setError("");

    fetch(
      `${API_URL}/doctors/${editingDoctor.id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: editingDoctor.name,
          specialization:
            editingDoctor.specialization,
          phone: editingDoctor.phone,
        }),
      }
    )
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
              : data?.message ||
                "Failed to update doctor"
          );
        }

        return data;
      })
      .then((data) => {
        console.log("Doctor updated:", data);

        setDoctors((prevDoctors) =>
          prevDoctors.map((doctor) =>
            doctor.id === data.id
              ? data
              : doctor
          )
        );

        setEditingDoctor(null);
      })
      .catch((error) => {
        console.error("Update doctor error:", error);

        setError(
          error.message ||
            "Failed to update doctor"
        );
      });
  };

  return (
    <div className="doctors-page">

      <h1>Doctors</h1>

      {/* =========================
          ERROR
      ========================== */}

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}


      {/* =========================
          ADMIN - ADD DOCTOR
      ========================== */}

      {user?.role === "ADMIN" && (
        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Doctor Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />

          <input
            type="text"
            placeholder="Specialization"
            value={specialization}
            onChange={(e) =>
              setSpecialization(
                e.target.value
              )
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

          <button type="submit">
            Add Doctor
          </button>

        </form>
      )}


      {/* =========================
          LOADING
      ========================== */}

      {loading && (
        <p>Loading doctors...</p>
      )}


      {/* =========================
          NO DOCTORS
      ========================== */}

      {!loading &&
        doctors.length === 0 &&
        !error && (
          <p>No doctors found.</p>
        )}


      {/* =========================
          DOCTOR LIST
      ========================== */}

      {!loading &&
        doctors.map((doctor) => (

          <div
            className="doctor-card"
            key={doctor.id}
          >

            <h2>
              {doctor.name}
            </h2>

            <p>
              <strong>
                Specialization:
              </strong>{" "}
              {doctor.specialization}
            </p>

            <p>
              <strong>
                Phone:
              </strong>{" "}
              {doctor.phone}
            </p>


            {/* =========================
                ADMIN - EDIT BUTTON
            ========================== */}

            {user?.role === "ADMIN" && (
              <button
                type="button"
                onClick={() =>
                  handleEdit(doctor.id)
                }
              >
                Edit
              </button>
            )}


            {/* =========================
                ADMIN - EDIT FORM
            ========================== */}

            {user?.role === "ADMIN" &&
              editingDoctor &&
              editingDoctor.id ===
                doctor.id && (

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdate();
                  }}
                >

                  <input
                    type="text"
                    value={
                      editingDoctor.name
                    }
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        name: e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    value={
                      editingDoctor.specialization
                    }
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        specialization:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    value={
                      editingDoctor.phone
                    }
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        phone: e.target.value,
                      })
                    }
                    required
                  />

                  <button type="submit">
                    Update Doctor
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingDoctor(null)
                    }
                  >
                    Cancel
                  </button>

                </form>
              )}


            {/* =========================
                ADMIN - DELETE
            ========================== */}

            {user?.role === "ADMIN" && (
              <button
                type="button"
                onClick={() =>
                  handleDelete(doctor.id)
                }
              >
                Delete
              </button>
            )}

          </div>

        ))}

    </div>
  );
}

export default Doctors;
