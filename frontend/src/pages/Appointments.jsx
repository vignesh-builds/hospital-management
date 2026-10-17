import { Fragment, useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import { getUser } from "../utils/auth";
import { todayISO, shortTime, formatDate } from "../utils/date";
import useApiData from "../utils/useApiData";
import {
  Alert,
  Empty,
  Field,
  PageHeader,
  StatusBadge,
} from "../components/ui";

const STATUSES = ["BOOKED", "CONFIRMED", "CANCELLED", "COMPLETED"];

const slotValue = (slot) => (typeof slot === "string" ? slot : slot.time);

function Appointments() {
  const user = getUser();
  const role = user?.role;

  const appointmentsEndpoint =
    role === "ADMIN"
      ? "/appointments"
      : role === "DOCTOR"
      ? "/appointments/doctor"
      : "/appointments/my";

  const appointmentsData = useApiData(user ? appointmentsEndpoint : null);
  const doctorsData = useApiData(user ? "/doctors" : null);
  const patientsData = useApiData(role === "ADMIN" ? "/patients" : null);

  const appointments = appointmentsData.data || [];
  const doctors = doctorsData.data || [];
  const patients = patientsData.data || [];

  // booking form
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [booking, setBooking] = useState(false);

  // edit form
  const [editingAppointment, setEditingAppointment] = useState(null);

  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  // filters
  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [historyType, setHistoryType] = useState("ALL");

  const today = todayISO();

  const error =
    actionError ||
    appointmentsData.error ||
    doctorsData.error ||
    patientsData.error;

  // =========================
  // AVAILABLE SLOTS
  // =========================

  const slotKey =
    appointmentDate && doctorId ? `${doctorId}|${appointmentDate}` : "";

  const [slotState, setSlotState] = useState({ key: "", slots: [] });

  useEffect(() => {
    if (!slotKey) return undefined;

    let ignore = false;

    apiRequest(
      `/availability/doctor/${doctorId}/date/${appointmentDate}/slots`
    )
      .then((data) => {
        if (!ignore) {
          setSlotState({
            key: slotKey,
            slots: Array.isArray(data) ? data : [],
          });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setSlotState({ key: slotKey, slots: [] });
          setActionError(err.message);
        }
      });

    return () => {
      ignore = true;
    };
  }, [slotKey, doctorId, appointmentDate]);

  const slotLoading = Boolean(slotKey) && slotState.key !== slotKey;
  const availableSlots = slotState.key === slotKey ? slotState.slots : [];

  // =========================
  // ACTIONS
  // =========================

  const runAction = async (path, method, successMessage) => {
    setActionError("");
    setMessage("");

    try {
      await apiRequest(path, { method });
      setMessage(successMessage);
      appointmentsData.reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setActionError("");
    setMessage("");

    if (!appointmentTime) {
      setActionError("Please select a time slot.");
      return;
    }

    const body = {
      appointmentDate,
      appointmentTime,
      doctor: { id: Number(doctorId) },
    };

    if (role === "ADMIN") {
      body.patient = { id: Number(patientId) };
    }

    setBooking(true);

    try {
      await apiRequest("/appointments", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setMessage("Appointment booked successfully!");
      setAppointmentDate("");
      setAppointmentTime("");
      setDoctorId("");
      setPatientId("");
      appointmentsData.reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBooking(false);
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment({
      ...appointment,
      appointmentTime: shortTime(appointment.appointmentTime),
    });
  };

  const handleUpdate = async () => {
    setActionError("");
    setMessage("");

    try {
      await apiRequest(`/appointments/${editingAppointment.id}`, {
        method: "PUT",
        body: JSON.stringify({
          appointmentDate: editingAppointment.appointmentDate,
          appointmentTime: editingAppointment.appointmentTime,
          status: editingAppointment.status,
          patient: { id: Number(editingAppointment.patientId) },
          doctor: { id: Number(editingAppointment.doctorId) },
        }),
      });

      setEditingAppointment(null);
      setMessage("Appointment updated.");
      appointmentsData.reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleCancel = (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    runAction(`/appointments/${id}/cancel`, "PUT", "Appointment cancelled.");
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this appointment permanently?")) return;
    runAction(`/appointments/${id}`, "DELETE", "Appointment deleted.");
  };

  const clearFilters = () => {
    setSearchText("");
    setFilterDate("");
    setFilterStatus("");
  };

  // =========================
  // FILTERING
  // =========================

  const search = searchText.toLowerCase();

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      !search ||
      appointment.doctorName?.toLowerCase().includes(search) ||
      appointment.patientName?.toLowerCase().includes(search) ||
      appointment.specialization?.toLowerCase().includes(search);

    const matchesDate =
      !filterDate || appointment.appointmentDate === filterDate;

    const matchesStatus = !filterStatus || appointment.status === filterStatus;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const historyAppointments = filteredAppointments.filter((appointment) => {
    if (role !== "PATIENT") return true;

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
      return appointment.status === "CANCELLED";
    }

    return true;
  });

  if (!user) {
    return (
      <>
        <PageHeader title="Appointments" />
        <Alert>Please log in first.</Alert>
      </>
    );
  }

  const isStaff = role === "DOCTOR" || role === "ADMIN";
  const canBook = role === "PATIENT" || role === "ADMIN";

  const tabs = [
    ["ALL", "All"],
    ["UPCOMING", "Upcoming"],
    ["PAST", "Past"],
    ["CANCELLED", "Cancelled"],
  ];

  return (
    <>
      <PageHeader
        title="Appointments"
        subtitle={
          role === "PATIENT"
            ? "Book a visit and track your appointment history."
            : "Review, confirm and manage appointments."
        }
      />

      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>

      {/* BOOK APPOINTMENT */}
      {canBook && (
        <section className="card section">
          <div className="card-head">
            <h2>Book an appointment</h2>
          </div>

          <form className="card-body" onSubmit={handleSubmit}>
            <div className="form-grid">
              {role === "ADMIN" && (
                <Field label="Patient">
                  <select
                    className="select"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    required
                  >
                    <option value="">Select patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Doctor">
                <select
                  className="select"
                  value={doctorId}
                  onChange={(e) => {
                    setDoctorId(e.target.value);
                    setAppointmentTime("");
                  }}
                  required
                >
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Date">
                <input
                  className="input"
                  type="date"
                  value={appointmentDate}
                  min={today}
                  onChange={(e) => {
                    setAppointmentDate(e.target.value);
                    setAppointmentTime("");
                  }}
                  required
                />
              </Field>
            </div>

            {appointmentDate && doctorId && (
              <div style={{ marginTop: 20 }}>
                <div className="slot-label">Available time slots</div>

                {slotLoading && (
                  <p className="page-sub">Loading available slots...</p>
                )}

                {!slotLoading && availableSlots.length === 0 && (
                  <p className="page-sub">
                    No slots available for this doctor on this date.
                  </p>
                )}

                {!slotLoading && availableSlots.length > 0 && (
                  <div className="slots">
                    {availableSlots.map((slot) => {
                      const value = slotValue(slot);

                      return (
                        <button
                          type="button"
                          key={value}
                          className={
                            appointmentTime === value ? "slot selected" : "slot"
                          }
                          aria-pressed={appointmentTime === value}
                          onClick={() => setAppointmentTime(value)}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn"
                disabled={!appointmentTime || booking}
              >
                {booking
                  ? "Booking..."
                  : appointmentTime
                  ? `Book for ${appointmentTime}`
                  : "Book appointment"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* APPOINTMENT LIST */}
      <section className="card">
        {role === "PATIENT" && (
          <div className="tabs" role="tablist">
            {tabs.map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={historyType === value}
                className={historyType === value ? "tab active" : "tab"}
                onClick={() => setHistoryType(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="toolbar">
          <input
            className="input"
            type="text"
            placeholder="Search doctor, patient or specialization"
            aria-label="Search appointments"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <input
            className="input"
            type="date"
            aria-label="Filter by date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <select
            className="select"
            aria-label="Filter by status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>

        <div className="result-count">
          Showing <strong>{historyAppointments.length}</strong> of{" "}
          {appointments.length} appointment
          {appointments.length === 1 ? "" : "s"}
        </div>

        {appointmentsData.loading && !appointmentsData.data ? (
          <p className="loading">Loading appointments...</p>
        ) : historyAppointments.length === 0 ? (
          <Empty title="No appointments found">
            Try changing the filters.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {historyAppointments.map((appointment) => {
                  const active =
                    appointment.status === "BOOKED" ||
                    appointment.status === "CONFIRMED";
                  const editing =
                    isStaff && editingAppointment?.id === appointment.id;

                  return (
                    <Fragment key={appointment.id}>
                      <tr>
                        <td className="num">#{appointment.id}</td>
                        <td className="cell-main">{appointment.patientName}</td>
                        <td>
                          <div>{appointment.doctorName}</div>
                          <div className="cell-sub">
                            {appointment.specialization}
                          </div>
                        </td>
                        <td>{formatDate(appointment.appointmentDate)}</td>
                        <td className="num">
                          {shortTime(appointment.appointmentTime)}
                        </td>
                        <td>
                          <StatusBadge status={appointment.status} />
                        </td>
                        <td className="col-actions">
                          <div
                            className="btn-row"
                            style={{ justifyContent: "flex-end" }}
                          >
                            {isStaff && appointment.status === "BOOKED" && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() =>
                                  runAction(
                                    `/appointments/${appointment.id}/confirm`,
                                    "PUT",
                                    "Appointment confirmed."
                                  )
                                }
                              >
                                Confirm
                              </button>
                            )}

                            {isStaff && appointment.status === "CONFIRMED" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={() =>
                                  runAction(
                                    `/appointments/${appointment.id}/complete`,
                                    "PUT",
                                    "Appointment marked as completed."
                                  )
                                }
                              >
                                Complete
                              </button>
                            )}

                            {isStaff && (
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleEdit(appointment)}
                              >
                                Edit
                              </button>
                            )}

                            {active && (
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => handleCancel(appointment.id)}
                              >
                                Cancel
                              </button>
                            )}

                            {role === "ADMIN" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(appointment.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {editing && (
                        <tr className="edit-row">
                          <td colSpan={7}>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdate();
                              }}
                            >
                              <div className="form-grid">
                                <Field label="Date">
                                  <input
                                    className="input"
                                    type="date"
                                    value={editingAppointment.appointmentDate}
                                    onChange={(e) =>
                                      setEditingAppointment({
                                        ...editingAppointment,
                                        appointmentDate: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                </Field>

                                <Field label="Time">
                                  <input
                                    className="input"
                                    type="time"
                                    step="1800"
                                    value={editingAppointment.appointmentTime}
                                    onChange={(e) =>
                                      setEditingAppointment({
                                        ...editingAppointment,
                                        appointmentTime: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                </Field>

                                {role === "ADMIN" && (
                                  <>
                                    <Field label="Patient">
                                      <select
                                        className="select"
                                        value={editingAppointment.patientId}
                                        onChange={(e) =>
                                          setEditingAppointment({
                                            ...editingAppointment,
                                            patientId: Number(e.target.value),
                                          })
                                        }
                                        required
                                      >
                                        {patients.map((patient) => (
                                          <option
                                            key={patient.id}
                                            value={patient.id}
                                          >
                                            {patient.name}
                                          </option>
                                        ))}
                                      </select>
                                    </Field>

                                    <Field label="Doctor">
                                      <select
                                        className="select"
                                        value={editingAppointment.doctorId}
                                        onChange={(e) =>
                                          setEditingAppointment({
                                            ...editingAppointment,
                                            doctorId: Number(e.target.value),
                                          })
                                        }
                                        required
                                      >
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
                                    </Field>
                                  </>
                                )}

                                <Field label="Status">
                                  <select
                                    className="select"
                                    value={editingAppointment.status}
                                    onChange={(e) =>
                                      setEditingAppointment({
                                        ...editingAppointment,
                                        status: e.target.value,
                                      })
                                    }
                                  >
                                    {STATUSES.map((status) => (
                                      <option key={status} value={status}>
                                        {status.charAt(0) +
                                          status.slice(1).toLowerCase()}
                                      </option>
                                    ))}
                                  </select>
                                </Field>
                              </div>

                              <div className="form-actions">
                                <button type="submit" className="btn btn-sm">
                                  Save changes
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => setEditingAppointment(null)}
                                >
                                  Close
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default Appointments;
