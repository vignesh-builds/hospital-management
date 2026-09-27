import "./patients.css";
import { useEffect, useState } from "react";

const API_URL = "https://hospital-backend-jcnb.onrender.com";

function Patients() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [patients, setPatients] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [editingPatient, setEditingPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${API_URL}/patients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch patients");
      }

      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          age: Number(age),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add patient");
      }

      const data = await response.json();

      setPatients((prev) => [...prev, data]);

      setName("");
      setEmail("");
      setPhone("");
      setAge("");
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/patients/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete patient");
      }

      setPatients((prev) =>
        prev.filter((patient) => patient.id !== id)
      );
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
    }
  };

  const handleEdit = (id) => {
    const patient = patients.find((patient) => patient.id === id);
    setEditingPatient({ ...patient });
  };

  const handleUpdate = async () => {
    if (!editingPatient) return;

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

      if (!response.ok) {
        throw new Error("Failed to update patient");
      }

      const data = await response.json();

      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === data.id ? data : patient
        )
      );

      setEditingPatient(null);
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="patients-page">

      <h1>Patients</h1>

      {user?.role === "ADMIN" && (
        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Patient Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />

          <button type="submit">
            Add Patient
          </button>

        </form>
      )}

      {patients.length === 0 ? (
        <p>No patients found.</p>
      ) : (
        patients.map((patient) => (
          <div
            className="patient-card"
            key={patient.id}
          >

            <h2>{patient.name}</h2>

            <p>
              <strong>Email:</strong> {patient.email}
            </p>

            <p>
              <strong>Phone:</strong> {patient.phone}
            </p>

            <p>
              <strong>Age:</strong> {patient.age}
            </p>

            {user?.role === "ADMIN" && (
              <>
                <button
                  onClick={() => handleEdit(patient.id)}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(patient.id)}
                >
                  Delete
                </button>
              </>
            )}

            {user?.role === "ADMIN" &&
              editingPatient?.id === patient.id && (

                <div>

                  <input
                    type="text"
                    value={editingPatient.name}
                    onChange={(e) =>
                      setEditingPatient({
                        ...editingPatient,
                        name: e.target.value,
                      })
                    }
                  />

                  <input
                    type="email"
                    value={editingPatient.email}
                    onChange={(e) =>
                      setEditingPatient({
                        ...editingPatient,
                        email: e.target.value,
                      })
                    }
                  />

                  <input
                    type="text"
                    value={editingPatient.phone}
                    onChange={(e) =>
                      setEditingPatient({
                        ...editingPatient,
                        phone: e.target.value,
                      })
                    }
                  />

                  <input
                    type="number"
                    value={editingPatient.age}
                    onChange={(e) =>
                      setEditingPatient({
                        ...editingPatient,
                        age: e.target.value,
                      })
                    }
                  />

                  <button onClick={handleUpdate}>
                    Update Patient
                  </button>

                  <button
                    onClick={() => setEditingPatient(null)}
                  >
                    Cancel
                  </button>

                </div>
              )}

          </div>
        ))
      )}

    </div>
  );
}

export default Patients;
