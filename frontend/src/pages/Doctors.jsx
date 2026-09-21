import "./Doctors.css";
import { useEffect, useState } from "react";

function Doctors() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");

  const [editingDoctor, setEditingDoctor] = useState(null);

  // Get all doctors
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:8080/doctors", {
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
        setDoctors(data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setError("Failed to fetch doctors");
        setLoading(false);
      });
  }, []);

  // Create doctor
  const handleSubmit = (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    fetch("http://localhost:8080/doctors", {
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
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to add doctor");
        }

        return response.json();
      })
      .then((data) => {
        console.log("Doctor added:", data);

        setDoctors((prevDoctors) => [...prevDoctors, data]);

        setName("");
        setSpecialization("");
        setPhone("");
      })
      .catch((error) => {
        console.log("Error:", error);
      });
  };

  // Delete doctor
  const handleDelete = (id) => {
    const token = localStorage.getItem("token");

    fetch(`http://localhost:8080/doctors/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete doctor");
        }

        console.log("Doctor deleted");

        setDoctors((prevDoctors) =>
          prevDoctors.filter((doctor) => doctor.id !== id)
        );
      })
      .catch((error) => {
        console.log("Error:", error);
      });
  };

  // Select doctor for editing
  const handleEdit = (id) => {
    const doctor = doctors.find((doctor) => doctor.id === id);

    setEditingDoctor(doctor);
  };

  // Update doctor
  const handleUpdate = () => {
    const token = localStorage.getItem("token");

    fetch(`http://localhost:8080/doctors/${editingDoctor.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: editingDoctor.name,
        specialization: editingDoctor.specialization,
        phone: editingDoctor.phone,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update doctor");
        }

        return response.json();
      })
      .then((data) => {
        console.log("Doctor updated:", data);

        setDoctors((prevDoctors) =>
          prevDoctors.map((doctor) =>
            doctor.id === data.id ? data : doctor
          )
        );

        setEditingDoctor(null);
      })
      .catch((error) => {
        console.log("Error:", error);
      });
  };

  return (
    <div className="doctors-page">

      <h1>Doctors</h1>

      {/* Admin Only - Add Doctor */}
      {user && user.role === "ADMIN" && (
        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Doctor Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          />

          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <button type="submit">
            Add Doctor
          </button>

        </form>
      )}

      {loading && <p>Loading doctors...</p>}

      {error && <p>{error}</p>}


      {/* Doctor List */}
      {doctors.map((doctor) => (

        <div className="doctor-card" key={doctor.id}>

          <h2>{doctor.name}</h2>

          <p>
            <strong>Specialization:</strong>{" "}
            {doctor.specialization}
          </p>

          <p>
            <strong>Phone:</strong>{" "}
            {doctor.phone}
          </p>


          {/* Admin Only - Edit */}
          {user && user.role === "ADMIN" && (
            <button onClick={() => handleEdit(doctor.id)}>
              Edit
            </button>
          )}


          {/* Admin Only - Edit Form */}
          {user &&
            user.role === "ADMIN" &&
            editingDoctor &&
            editingDoctor.id === doctor.id && (

              <form>

                <input
                  type="text"
                  value={editingDoctor.name}
                  onChange={(e) =>
                    setEditingDoctor({
                      ...editingDoctor,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  type="text"
                  value={editingDoctor.specialization}
                  onChange={(e) =>
                    setEditingDoctor({
                      ...editingDoctor,
                      specialization: e.target.value,
                    })
                  }
                />

                <input
                  type="text"
                  value={editingDoctor.phone}
                  onChange={(e) =>
                    setEditingDoctor({
                      ...editingDoctor,
                      phone: e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  onClick={handleUpdate}
                >
                  Update Doctor
                </button>

              </form>
            )}


          {/* Admin Only - Delete */}
          {user && user.role === "ADMIN" && (
            <button onClick={() => handleDelete(doctor.id)}>
              Delete
            </button>
          )}

        </div>

      ))}

    </div>
  );
}

export default Doctors;