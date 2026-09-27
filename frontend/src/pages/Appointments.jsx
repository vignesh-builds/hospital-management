import "./Appointments.css";
import { useEffect, useState } from "react";

const API_URL = "https://hospital-backend-jcnb.onrender.com";

function Appointments() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");

  const [editingAppointment, setEditingAppointment] = useState(null);

  const [error, setError] = useState("");
  const [slotLoading, setSlotLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [historyType, setHistoryType] = useState("ALL");

  const token = localStorage.getItem("token");

  // =========================
  // GET DATA
  // =========================

  useEffect(() => {
    if (!user || !token) {
      setError("Please login first.");
      return;
    }

    const appointmentUrl =
      user.role === "PATIENT"
        ? `${API_URL}/appointments/my`
        : `${API_URL}/appointments`;

    fetch(appointmentUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const text = await response.text();

        if (!response.ok) {
          throw new Error(
            text || "Failed to fetch appointments"
          );
        }

        return text ? JSON.parse(text) : [];
      })
      .then((data) => {
        setAppointments(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Appointment Error:", error);
        setError(error.message);
      });

    // Doctors
    fetch(`${API_URL}/doctors`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const text = await response.text();

        if (!response.ok) {
          throw new Error(
            text || "Failed to fetch doctors"
          );
        }

        return text ? JSON.parse(text) : [];
      })
      .then((data) => {
        setDoctors(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Doctor Error:", error);
      });

    // Patients
    if (
      user.role === "PATIENT" ||
      user.role === "ADMIN"
    ) {
      fetch(`${API_URL}/patients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (response) => {
          const text = await response.text();

          if (!response.ok) {
            throw new Error(
              text || "Failed to fetch patients"
            );
          }

          return text ? JSON.parse(text) : [];
        })
        .then((data) => {
          setPatients(Array.isArray(data) ? data : []);
        })
        .catch((error) => {
          console.error("Patient Error:", error);
        });
    }
  }, [user?.role, token]);

  // =========================
  // AVAILABLE SLOTS
  // =========================

  useEffect(() => {
    if (!appointmentDate || !doctorId) {
      setAvailableSlots([]);
      setAppointmentTime("");
      return;
    }

    setSlotLoading(true);
    setAvailableSlots([]);
    setAppointmentTime("");
    setError("");

    fetch(
      `${API_URL}/availability/doctor/${doctorId}/date/${appointmentDate}/slots`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(async (response) => {
        const text = await response.text();

        if (!response.ok) {
          throw new Error(
            text || "Failed to fetch available slots"
          );
        }

        return text ? JSON.parse(text) : [];
      })
      .then((data) => {
        setAvailableSlots(
          Array.isArray(data) ? data : []
        );
      })
      .catch((error) => {
        console.error("Slot Error:", error);
        setError(error.message);
      })
      .finally(() => {
        setSlotLoading(false);
      });
  }, [appointmentDate, doctorId, token]);

  // =========================
  // BOOK APPOINTMENT
  // =========================

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    if (!appointmentDate) {
      setError("Please select appointment date");
      return;
    }

    if (!doctorId) {
      setError("Please select doctor");
      return;
    }

    if (!appointmentTime) {
      setError("Please select an available time slot");
      return;
    }

    if (user.role === "ADMIN" && !patientId) {
      setError("Please select patient");
      return;
    }

    const appointmentData = {
      appointmentDate,
      appointmentTime,
      doctor: {
        id: Number(doctorId),
      },
    };

    if (user.role === "ADMIN") {
      appointmentData.patient = {
        id: Number(patientId),
      };
    }

    fetch(`${API_URL}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(appointmentData),
    })
      .then(async (response) => {
        const text = await response.text();

        if (!response.ok) {
          throw new Error(
            text || "Failed to book appointment"
          );
        }

        return text ? JSON.parse(text) : {};
      })
      .then((data) => {
        setAppointments((prev) => [...prev, data]);

        setAppointmentDate("");
        setAppointmentTime("");
        setPatientId("");
        setDoctorId("");
        setAvailableSlots([]);

        alert("Appointment booked successfully!");
      })
      .catch((error) => {
        console.error("Booking Error:", error);
        setError(error.message);
      });
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this appointment?"
      )
    ) {
      return;
    }

    fetch(`${API_URL}/appointments/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const text = await response.text();

        if (!response.ok) {
          throw new Error(
            text || "Failed to delete appointment"
          );
        }
      })
      .then(() => {
        setAppointments((prev) =>
          prev.filter(
            (appointment) =>
              appointment.id !== id
          )
        );
      })
      .catch((error) => {
        console.error("Delete Error:", error);
        setError(error.message);
      });
  };

  // =========================
  // EDIT
  // =========================

  const handleEdit = (id) => {
    const appointment = appointments.find(
      (item) => item.id === id
    );

    if (!appointment) return;

    setEditingAppointment({
      ...appointment,
      patientId:
        appointment.patientId ||
        appointment.patient?.id ||
        "",
      doctorId:
        appointment.doctorId ||
        appointment.doctor?.id ||
        "",
    });
  };

  // =========================
  // UPDATE
  // =========================

  const handleUpdate = () => {
    if (!editingAppointment) return;

    setError("");

    const updateData = {
      appointmentDate:
        editingAppointment.appointmentDate,

      appointmentTime:
        editingAppointment.appointmentTime,

      status: editingAppointment.status,

      patient: {
        id: Number(editingAppointment.patientId),
      },

      doctor: {
        id: Number(editingAppointment.doctorId),
      },
    };

    fetch(
      `${API_URL}/appointments/${editingAppointment.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      }
    )
      .then(async (response) => {
        const text = await response.text();

        if (!response.ok) {
          throw new Error(
            text || "Failed to update appointment"
          );
        }

        return text ? JSON.parse(text) : {};
      })
      .then((data) => {
        setAppointments((prev) =>
          prev.map((appointment) =>
            appointment.id === data.id
              ? data
              : appointment
          )
        );

        setEditingAppointment(null);
      })
      .catch((error) => {
        console.error("Update Error:", error);
        setError(error.message);
      });
  };

  // =========================
  // CANCEL
  // =========================

  const handleCancel = (id) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this appointment?"
      )
    ) {
      return;
    }

    setError("");

    fetch(
      `${API_URL}/appointments/${id}/cancel`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(async (response) => {
        const text = await response.text();

        if (!response.ok) {
          throw new Error(
            text || "Failed to cancel appointment"
          );
        }

        return text ? JSON.parse(text) : {};
      })
      .then((data) => {
        setAppointments((prev) =>
          prev.map((appointment) =>
            appointment.id === data.id
              ? data
              : appointment
          )
        );
      })
      .catch((error) => {
        console.error("Cancel Error:", error);
        setError(error.message);
      });
  };

  // =========================
  // FILTER
  // =========================

  const clearFilters = () => {
    setSearchText("");
    setFilterDate("");
    setFilterStatus("");
  };

  const filteredAppointments =
    appointments.filter((appointment) => {
      const search = searchText.toLowerCase();

      const matchesSearch =
        !search ||
        appointment.doctorName
          ?.toLowerCase()
          .includes(search) ||
        appointment.patientName
          ?.toLowerCase()
          .includes(search) ||
        appointment.specialization
          ?.toLowerCase()
          .includes(search);

      const matchesDate =
        !filterDate ||
        appointment.appointmentDate === filterDate;

      const matchesStatus =
        !filterStatus ||
        appointment.status === filterStatus;

      return (
        matchesSearch &&
        matchesDate &&
        matchesStatus
      );
    });

  // =========================
  // PATIENT HISTORY
  // =========================

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const historyAppointments =
    filteredAppointments.filter(
      (appointment) => {
        if (user.role !== "PATIENT") {
          return true;
        }

        if (historyType === "UPCOMING") {
          return (
            appointment.appointmentDate >= today &&
            appointment.status !== "CANCELLED" &&
            appointment.status !== "COMPLETED"
          );
        }

        if (historyType === "PAST") {
          return (
            appointment.appointmentDate < today ||
            appointment.status === "COMPLETED"
          );
        }

        if (historyType === "CANCELLED") {
          return (
            appointment.status === "CANCELLED"
          );
        }

        return true;
      }
    );

  if (!user) {
    return (
      <div className="appointments-page">
        <h1>Appointments</h1>
        <p className="error-message">
          Please login first.
        </p>
      </div>
    );
  }

  return (
    <div className="appointments-page">

      <h1>Appointments</h1>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {/* =========================
          BOOK APPOINTMENT
      ========================= */}

      {(user.role === "PATIENT" ||
        user.role === "ADMIN") && (

        <form onSubmit={handleSubmit}>

          <input
            type="date"
            value={appointmentDate}
            min={today}
            onChange={(e) => {
              setAppointmentDate(e.target.value);
              setAppointmentTime("");
            }}
            required
          />

          {user.role === "ADMIN" && (
            <select
              value={patientId}
              onChange={(e) =>
                setPatientId(e.target.value)
              }
              required
            >
              <option value="">
                Select Patient
              </option>

              {patients.map((patient) => (
                <option
                  key={patient.id}
                  value={patient.id}
                >
                  {patient.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              setAppointmentTime("");
            }}
            required
          >
            <option value="">
              Select Doctor
            </option>

            {doctors.map((doctor) => (
              <option
                key={doctor.id}
                value={doctor.id}
              >
                {doctor.name} -{" "}
                {doctor.specialization}
              </option>
            ))}
          </select>

          {appointmentDate && doctorId && (
            <div className="available-slots">

              <h3>
                Available Time Slots
              </h3>

              {slotLoading && (
                <p>
                  Loading available slots...
                </p>
              )}

              {!slotLoading &&
                availableSlots.length === 0 && (
                  <p>
                    No available slots for this date.
                  </p>
                )}

              {!slotLoading &&
                availableSlots.length > 0 && (
                  <div className="slot-container">

                    {availableSlots.map((slot) => (
                      <button
                        type="button"
                        key={
                          typeof slot === "string"
                            ? slot
                            : slot.time
                        }
                        className={
                          appointmentTime ===
                          (typeof slot === "string"
                            ? slot
                            : slot.time)
                            ? "slot-btn selected"
                            : "slot-btn"
                        }
                        onClick={() =>
                          setAppointmentTime(
                            typeof slot === "string"
                              ? slot
                              : slot.time
                          )
                        }
                      >
                        {typeof slot === "string"
                          ? slot
                          : slot.time}
                      </button>
                    ))}

                  </div>
                )}

            </div>
          )}

          {appointmentTime && (
            <p>
              <strong>
                Selected Time:
              </strong>{" "}
              {appointmentTime}
            </p>
          )}

          <button
            type="submit"
            disabled={!appointmentTime}
          >
            Book Appointment
          </button>

        </form>
      )}

      {/* =========================
          PATIENT HISTORY TABS
      ========================= */}

      {user.role === "PATIENT" && (
        <div className="history-section">

          <h2>
            My Appointment History
          </h2>

          <div className="history-tabs">

            {[
              ["ALL", "All"],
              ["UPCOMING", "Upcoming"],
              ["PAST", "Past"],
              ["CANCELLED", "Cancelled"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  historyType === value
                    ? "history-tab active"
                    : "history-tab"
                }
                onClick={() =>
                  setHistoryType(value)
                }
              >
                {label}
              </button>
            ))}

          </div>

        </div>
      )}

      {/* =========================
          SEARCH & FILTER
      ========================= */}

      <div className="appointment-filters">

        <h2>
          Search & Filter
        </h2>

        <div className="filter-row">

          <input
            type="text"
            placeholder="Search doctor, patient..."
            value={searchText}
            onChange={(e) =>
              setSearchText(e.target.value)
            }
          />

          <input
            type="date"
            value={filterDate}
            onChange={(e) =>
              setFilterDate(e.target.value)
            }
          />

          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value)
            }
          >
            <option value="">
              All Status
            </option>

            <option value="BOOKED">
              BOOKED
            </option>

            <option value="CONFIRMED">
              CONFIRMED
            </option>

            <option value="CANCELLED">
              CANCELLED
            </option>

            <option value="COMPLETED">
              COMPLETED
            </option>
          </select>

          <button
            type="button"
            className="clear-filter-btn"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

        </div>

        <p className="result-count">
          Showing{" "}
          <strong>
            {historyAppointments.length}
          </strong>{" "}
          appointment(s)
        </p>

      </div>

      {/* =========================
          APPOINTMENT LIST
      ========================= */}

      {historyAppointments.length === 0 ? (

        <div className="no-appointments">
          <p>
            No appointments found.
          </p>
        </div>

      ) : (

        historyAppointments.map(
          (appointment) => (

            <div
              className="appointment-card"
              key={appointment.id}
            >

              <h2>
                Appointment #{appointment.id}
              </h2>

              <p>
                <strong>Date:</strong>{" "}
                {appointment.appointmentDate}
              </p>

              <p>
                <strong>Time:</strong>{" "}
                {appointment.appointmentTime}
              </p>

              <p>
                <strong>Status:</strong>{" "}

                <span
                  className={`status ${
                    appointment.status?.toLowerCase() || ""
                  }`}
                >
                  {appointment.status}
                </span>
              </p>

              <p>
                <strong>Patient:</strong>{" "}
                {appointment.patientName}
              </p>

              <p>
                <strong>Doctor:</strong>{" "}
                {appointment.doctorName}
              </p>

              <p>
                <strong>
                  Specialization:
                </strong>{" "}
                {appointment.specialization}
              </p>

              {/* EDIT */}

              {(user.role === "DOCTOR" ||
                user.role === "ADMIN") && (
                <button
                  type="button"
                  className="edit-btn"
                  onClick={() =>
                    handleEdit(appointment.id)
                  }
                >
                  Edit
                </button>
              )}

              {/* EDIT FORM */}

              {editingAppointment &&
                editingAppointment.id ===
                  appointment.id &&
                (user.role === "DOCTOR" ||
                  user.role === "ADMIN") && (

                  <form>

                    <input
                      type="date"
                      value={
                        editingAppointment.appointmentDate
                      }
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          appointmentDate:
                            e.target.value,
                        })
                      }
                      required
                    />

                    <input
                      type="time"
                      value={
                        editingAppointment.appointmentTime
                      }
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          appointmentTime:
                            e.target.value,
                        })
                      }
                      required
                    />

                    {user.role === "ADMIN" && (
                      <>
                        <select
                          value={
                            editingAppointment.patientId
                          }
                          onChange={(e) =>
                            setEditingAppointment({
                              ...editingAppointment,
                              patientId:
                                Number(
                                  e.target.value
                                ),
                            })
                          }
                          required
                        >
                          {patients.map(
                            (patient) => (
                              <option
                                key={patient.id}
                                value={patient.id}
                              >
                                {patient.name}
                              </option>
                            )
                          )}
                        </select>

                        <select
                          value={
                            editingAppointment.doctorId
                          }
                          onChange={(e) =>
                            setEditingAppointment({
                              ...editingAppointment,
                              doctorId:
                                Number(
                                  e.target.value
                                ),
                            })
                          }
                          required
                        >
                          {doctors.map(
                            (doctor) => (
                              <option
                                key={doctor.id}
                                value={doctor.id}
                              >
                                {doctor.name} -{" "}
                                {
                                  doctor.specialization
                                }
                              </option>
                            )
                          )}
                        </select>
                      </>
                    )}

                    <select
                      value={
                        editingAppointment.status
                      }
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="BOOKED">
                        BOOKED
                      </option>

                      <option value="CONFIRMED">
                        CONFIRMED
                      </option>

                      <option value="CANCELLED">
                        CANCELLED
                      </option>

                      <option value="COMPLETED">
                        COMPLETED
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={handleUpdate}
                    >
                      Update Appointment
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingAppointment(null)
                      }
                    >
                      Close
                    </button>

                  </form>
                )}

              {/* CANCEL */}

              {appointment.status !== "CANCELLED" &&
                (user.role === "DOCTOR" ||
                  user.role === "ADMIN") && (

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() =>
                      handleCancel(appointment.id)
                    }
                  >
                    Cancel
                  </button>
                )}

              {/* DELETE */}

              {user.role === "ADMIN" && (
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() =>
                    handleDelete(appointment.id)
                  }
                >
                  Delete
                </button>
              )}

            </div>
          )
        )
      )}

    </div>
  );
}

export default Appointments;
