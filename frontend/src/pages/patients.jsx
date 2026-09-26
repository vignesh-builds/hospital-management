import "./patients.css";
import { useEffect, useState } from "react";

function Patients() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [patients, setPatients] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");

  const [editingPatient, setEditingPatient] = useState(null);

  // Get all patients
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:8080/patients", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch patients");
        }

        return response.json();
      })
      .then((data) => {
        setPatients(data);
      })
      .catch((error) => {
        console.log("Error:", error);
      });
  }, []);

  // Create patient
  const handleSubmit = (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    fetch("http://localhost:8080/patients", {
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
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to add patient");
        }

        return response.json();
      })
      .then((data) => {
        console.log("Patient added:", data);

        setPatients((prevPatients) => [...prevPatients, data]);

        setName("");
        setEmail("");
        setPhone("");
        setAge("");
      })
      .catch((error) => {
        console.log("Error:", error);
      });
  };

  // Delete patient
  const handleDelete = (id) => {
    const token = localStorage.getItem("token");

    fetch(`http://localhost:8080/patients/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete patient");
        }

        setPatients((prevPatients) =>
          prevPatients.filter((patient) => patient.id !== id)
        );
      })
      .catch((error) => {
        console.log("Error:", error);
      });
  };

  // Select patient for editing
  const handleEdit = (id) => {
    const patient = patients.find(
      (patient) => patient.id === id
    );

    setEditingPatient(patient);
  };

  // Update patient
  const handleUpdate = () => {
    const token = localStorage.getItem("token");

    fetch(
      `http://localhost:8080/patients/${editingPatient.id}`,
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
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update patient");
        }

        return response.json();
      })
      .then((data) => {
        console.log("Patient updated:", data);

        setPatients((prevPatients) =>
          prevPatients.map((patient) =>
            patient.id === data.id ? data : patient
          )
        );

        setEditingPatient(null);
      })
      .catch((error) => {
        console.log("Error:", error);
      });
  };

  return (
    <div className="patients-page">

      <h1>Patients</h1>

      {/* Admin Only - Add Patient */}
      {user && user.role === "ADMIN" && (
        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Patient Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />

          <button type="submit">
            Add Patient
          </button>

        </form>
      )}


      {/* Patient List */}
      {patients.map((patient) => (

        <div
          className="patient-card"
          key={patient.id}
        >

          <h2>{patient.name}</h2>

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


          {/* Admin Only - Edit */}
          {user && user.role === "ADMIN" && (
            <button onClick={() => handleEdit(patient.id)}>
              Edit
            </button>
          )}


          {/* Admin Only - Edit Form */}
          {user &&
            user.role === "ADMIN" &&
            editingPatient &&
            editingPatient.id === patient.id && (

              <form>

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

                <button
                  type="button"
                  onClick={handleUpdate}
                >
                  Update Patient
                </button>

              </form>
            )}


          {/* Admin Only - Delete */}
          {user && user.role === "ADMIN" && (
            <button
              onClick={() => handleDelete(patient.id)}
            >
              Delete
            </button>
          )}

        </div>

      ))}

    </div>
  );
}

export default Patients;
