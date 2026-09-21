import "./Appointments.css";
import { useEffect, useState } from "react";

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

  // Patient history tab
  const [historyType, setHistoryType] = useState("ALL");

  // =========================
  // GET DATA
  // =========================

  useEffect(() => {
    const token = localStorage.getItem("token");

    const appointmentUrl =
      user.role === "PATIENT"
        ? "http://localhost:8080/appointments/my"
        : "http://localhost:8080/appointments";

    fetch(appointmentUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const message = await response.text();
          throw new Error(
            message || "Failed to fetch appointments"
          );
        }

        return response.json();
      })
      .then((data) => {
        setAppointments(data);
      })
      .catch((error) => {
        setError(error.message);
      });

    fetch("http://localhost:8080/doctors", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => setDoctors(data))
      .catch((error) =>
        console.log("Doctor Error:", error)
      );

    if (
      user.role === "PATIENT" ||
      user.role === "ADMIN"
    ) {
      fetch("http://localhost:8080/patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => setPatients(data))
        .catch((error) =>
          console.log("Patient Error:", error)
        );
    }
  }, [user.role]);

  // =========================
  // AVAILABLE SLOTS
  // =========================

  useEffect(() => {
    if (!appointmentDate || !doctorId) {
      setAvailableSlots([]);
      setAppointmentTime("");
      return;
    }

    const token = localStorage.getItem("token");

    setSlotLoading(true);
    setAvailableSlots([]);
    setAppointmentTime("");
    setError("");

    fetch(
      `http://localhost:8080/availability/doctor/${doctorId}/date/${appointmentDate}/slots`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          const message = await response.text();
          throw new Error(
            message || "Failed to fetch available slots"
          );
        }

        return response.json();
      })
      .then((data) => {
        setAvailableSlots(data);
      })
      .catch((error) => {
        setError(error.message);
      })
      .finally(() => {
        setSlotLoading(false);
      });
  }, [appointmentDate, doctorId]);

  // =========================
  // BOOK APPOINTMENT
  // =========================

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    if (!appointmentTime) {
      setError("Please select an available time slot");
      return;
    }

    const token = localStorage.getItem("token");

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

    fetch("http://localhost:8080/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(appointmentData),
    })
      .then(async (response) => {
        const data = await response.text();

        if (!response.ok) {
          throw new Error(data);
        }

        return JSON.parse(data);
      })
      .then((data) => {
        setAppointments((prev) => [
          ...prev,
          data,
        ]);

        setAppointmentDate("");
        setAppointmentTime("");
        setPatientId("");
        setDoctorId("");
        setAvailableSlots([]);
      })
      .catch((error) => {
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

    const token = localStorage.getItem("token");

    fetch(
      `http://localhost:8080/appointments/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await response.text());
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

    setEditingAppointment(appointment);
  };

  // =========================
  // UPDATE
  // =========================

  const handleUpdate = () => {
    setError("");

    const token = localStorage.getItem("token");

    fetch(
      `http://localhost:8080/appointments/${editingAppointment.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentDate:
            editingAppointment.appointmentDate,

          appointmentTime:
            editingAppointment.appointmentTime,

          status:
            editingAppointment.status,

          patient: {
            id: editingAppointment.patientId,
          },

          doctor: {
            id: editingAppointment.doctorId,
          },
        }),
      }
    )
      .then(async (response) => {
        const data = await response.text();

        if (!response.ok) {
          throw new Error(data);
        }

        return JSON.parse(data);
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

    const token = localStorage.getItem("token");

    fetch(
      `http://localhost:8080/appointments/${id}/cancel`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(async (response) => {
        const data = await response.text();

        if (!response.ok) {
          throw new Error(data);
        }

        return JSON.parse(data);
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
        setError(error.message);
      });
  };

  // =========================
  // CLEAR FILTERS
  // =========================

  const clearFilters = () => {
    setSearchText("");
    setFilterDate("");
    setFilterStatus("");
  };

  // =========================
  // FILTER
  // =========================

  const filteredAppointments =
    appointments.filter((appointment) => {

      const search =
        searchText.toLowerCase();

      const matchesSearch =
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
        appointment.appointmentDate ===
          filterDate;

      const matchesStatus =
        !filterStatus ||
        appointment.status ===
          filterStatus;

      return (
        matchesSearch &&
        matchesDate &&
        matchesStatus
      );
    });

  // =========================
  // PATIENT HISTORY FILTER
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
            appointment.appointmentDate >=
              today &&
            appointment.status !==
              "CANCELLED"
          );
        }

        if (historyType === "PAST") {
          return (
            appointment.appointmentDate <
            today
          );
        }

        if (historyType === "CANCELLED") {
          return (
            appointment.status ===
            "CANCELLED"
          );
        }

        return true;
      }
    );

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
              setAppointmentDate(
                e.target.value
              );
              setAppointmentTime("");
            }}
            required
          />

          {user.role === "ADMIN" && (
            <select
              value={patientId}
              onChange={(e) =>
                setPatientId(
                  e.target.value
                )
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
              setDoctorId(
                e.target.value
              );
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

          {/* AVAILABLE SLOTS */}

          {appointmentDate &&
            doctorId && (

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
                  availableSlots.length ===
                    0 && (
                    <p>
                      No available slots
                      for this date.
                    </p>
                  )}

                {!slotLoading &&
                  availableSlots.length >
                    0 && (

                    <div className="slot-container">

                      {availableSlots.map(
                        (slot) => (

                          <button
                            type="button"
                            key={slot.time}
                            className={
                              appointmentTime ===
                              slot.time
                                ? "slot-btn selected"
                                : "slot-btn"
                            }
                            onClick={() =>
                              setAppointmentTime(
                                slot.time
                              )
                            }
                          >
                            {slot.time}
                          </button>

                        )
                      )}

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

            <button
              className={
                historyType === "ALL"
                  ? "history-tab active"
                  : "history-tab"
              }
              onClick={() =>
                setHistoryType("ALL")
              }
            >
              All
            </button>

            <button
              className={
                historyType === "UPCOMING"
                  ? "history-tab active"
                  : "history-tab"
              }
              onClick={() =>
                setHistoryType("UPCOMING")
              }
            >
              Upcoming
            </button>

            <button
              className={
                historyType === "PAST"
                  ? "history-tab active"
                  : "history-tab"
              }
              onClick={() =>
                setHistoryType("PAST")
              }
            >
              Past
            </button>

            <button
              className={
                historyType === "CANCELLED"
                  ? "history-tab active"
                  : "history-tab"
              }
              onClick={() =>
                setHistoryType("CANCELLED")
              }
            >
              Cancelled
            </button>

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
              setSearchText(
                e.target.value
              )
            }
          />

          <input
            type="date"
            value={filterDate}
            onChange={(e) =>
              setFilterDate(
                e.target.value
              )
            }
          />

          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value
              )
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

      {historyAppointments.length ===
      0 ? (

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
                Appointment #
                {appointment.id}
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
                  className={`status ${appointment.status.toLowerCase()}`}
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
                  className="edit-btn"
                  onClick={() =>
                    handleEdit(
                      appointment.id
                    )
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
                        editingAppointment
                          .appointmentDate
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
                        editingAppointment
                          .appointmentTime
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

                    {user.role ===
                      "ADMIN" && (

                      <select
                        value={
                          editingAppointment
                            .patientId
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
                              key={
                                patient.id
                              }
                              value={
                                patient.id
                              }
                            >
                              {patient.name}
                            </option>

                          )
                        )}
                      </select>
                    )}

                    {user.role ===
                      "ADMIN" && (

                      <select
                        value={
                          editingAppointment
                            .doctorId
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
                              key={
                                doctor.id
                              }
                              value={
                                doctor.id
                              }
                            >
                              {doctor.name} -{" "}
                              {
                                doctor.specialization
                              }
                            </option>

                          )
                        )}
                      </select>
                    )}

                    <select
                      value={
                        editingAppointment.status
                      }
                      onChange={(e) =>
                        setEditingAppointment({
                          ...editingAppointment,
                          status:
                            e.target.value,
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
                      onClick={
                        handleUpdate
                      }
                    >
                      Update Appointment
                    </button>

                  </form>
                )}

              {/* CANCEL */}

              {appointment.status !==
                "CANCELLED" &&
                (user.role === "DOCTOR" ||
                  user.role === "ADMIN") && (

                  <button
                    className="cancel-btn"
                    onClick={() =>
                      handleCancel(
                        appointment.id
                      )
                    }
                  >
                    Cancel
                  </button>
                )}

              {/* DELETE */}

              {user.role === "ADMIN" && (

                <button
                  className="delete-btn"
                  onClick={() =>
                    handleDelete(
                      appointment.id
                    )
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