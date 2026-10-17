import { useState } from "react";
import { apiRequest } from "../utils/api";
import { getUser } from "../utils/auth";
import { todayISO, shortTime, formatDate } from "../utils/date";
import useApiData from "../utils/useApiData";
import {
  Alert,
  Empty,
  Field,
  PageHeader,
  StatCard,
  StatusBadge,
} from "../components/ui";

function DoctorDashboard() {
  const user = getUser();

  const profileData = useApiData("/doctors/me");
  const doctor = profileData.data;

  const appointmentsData = useApiData("/appointments/doctor");
  const availabilityData = useApiData(
    doctor ? `/availability/doctor/${doctor.id}` : null
  );

  const appointments = appointmentsData.data || [];
  const availability = availabilityData.data || [];

  const [form, setForm] = useState({
    availableDate: "",
    startTime: "09:00",
    endTime: "17:00",
  });
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const error =
    actionError ||
    profileData.error ||
    appointmentsData.error ||
    availabilityData.error;

  const today = todayISO();

  const isActive = (a) => a.status === "BOOKED" || a.status === "CONFIRMED";

  const todayAppointments = appointments.filter(
    (a) => a.appointmentDate === today && a.status !== "CANCELLED"
  );
  const upcoming = appointments
    .filter((a) => isActive(a) && a.appointmentDate >= today)
    .sort((a, b) =>
      `${a.appointmentDate} ${a.appointmentTime}`.localeCompare(
        `${b.appointmentDate} ${b.appointmentTime}`
      )
    );
  const completed = appointments.filter((a) => a.status === "COMPLETED");

  const upcomingAvailability = availability
    .filter((a) => a.availableDate >= today)
    .sort((a, b) =>
      `${a.availableDate} ${a.startTime}`.localeCompare(
        `${b.availableDate} ${b.startTime}`
      )
    );

  // CONFIRM / COMPLETE / CANCEL
  const runAction = async (path, successMessage) => {
    setActionError("");
    setMessage("");

    try {
      await apiRequest(path, { method: "PUT" });
      setMessage(successMessage);
      appointmentsData.reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // ADD AVAILABILITY
  const handleAddAvailability = async (event) => {
    event.preventDefault();
    setActionError("");
    setMessage("");
    setSaving(true);

    try {
      await apiRequest("/availability", {
        method: "POST",
        body: JSON.stringify({
          availableDate: form.availableDate,
          startTime: form.startTime,
          endTime: form.endTime,
          doctor: { id: doctor.id },
        }),
      });

      setMessage("Availability added.");
      setForm({ ...form, availableDate: "" });
      availabilityData.reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // DELETE AVAILABILITY
  const handleDeleteAvailability = async (id) => {
    if (!window.confirm("Remove this availability?")) return;

    setActionError("");
    setMessage("");

    try {
      await apiRequest(`/availability/${id}`, { method: "DELETE" });
      setMessage("Availability removed.");
      availabilityData.reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Doctor dashboard"
        subtitle={`Dr. ${doctor?.name || user?.name || ""}${
          doctor?.specialization ? ` · ${doctor.specialization}` : ""
        }`}
      />

      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>

      <div className="stats">
        <StatCard label="Total appointments" value={appointments.length} />
        <StatCard label="Today" value={todayAppointments.length} tone="info" />
        <StatCard label="Upcoming" value={upcoming.length} tone="warn" />
        <StatCard label="Completed" value={completed.length} tone="ok" />
      </div>

      {/* UPCOMING APPOINTMENTS */}
      <section className="card section">
        <div className="card-head">
          <h2>Upcoming appointments</h2>
        </div>

        {upcoming.length === 0 ? (
          <Empty title="No upcoming appointments" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="cell-main">{appointment.patientName}</td>
                    <td>{formatDate(appointment.appointmentDate)}</td>
                    <td className="num">
                      {shortTime(appointment.appointmentTime)}
                    </td>
                    <td>
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td className="col-actions">
                      <div className="btn-row" style={{ justifyContent: "flex-end" }}>
                        {appointment.status === "BOOKED" && (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() =>
                              runAction(
                                `/appointments/${appointment.id}/confirm`,
                                "Appointment confirmed."
                              )
                            }
                          >
                            Confirm
                          </button>
                        )}

                        {appointment.status === "CONFIRMED" && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() =>
                              runAction(
                                `/appointments/${appointment.id}/complete`,
                                "Appointment marked as completed."
                              )
                            }
                          >
                            Complete
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            if (window.confirm("Cancel this appointment?")) {
                              runAction(
                                `/appointments/${appointment.id}/cancel`,
                                "Appointment cancelled."
                              );
                            }
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MY AVAILABILITY */}
      <section className="card section">
        <div className="card-head">
          <h2>My availability</h2>
        </div>

        {doctor ? (
          <form className="card-body" onSubmit={handleAddAvailability}>
            <div className="form-grid">
              <Field label="Date">
                <input
                  className="input"
                  type="date"
                  min={today}
                  value={form.availableDate}
                  onChange={(e) =>
                    setForm({ ...form, availableDate: e.target.value })
                  }
                  required
                />
              </Field>

              <Field label="From">
                <input
                  className="input"
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                  required
                />
              </Field>

              <Field label="To">
                <input
                  className="input"
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                  required
                />
              </Field>

              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Adding..." : "Add availability"}
              </button>
            </div>
          </form>
        ) : (
          !profileData.loading && (
            <Empty title="Doctor profile not found">
              This account has no doctor profile linked to it.
            </Empty>
          )
        )}

        {upcomingAvailability.length === 0 ? (
          <Empty title="No upcoming availability added" />
        ) : (
          <div className="table-wrap" style={{ borderTop: "1px solid var(--line)" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>From</th>
                  <th>To</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {upcomingAvailability.map((slot) => (
                  <tr key={slot.id}>
                    <td>{formatDate(slot.availableDate)}</td>
                    <td className="num">{shortTime(slot.startTime)}</td>
                    <td className="num">{shortTime(slot.endTime)}</td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteAvailability(slot.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ALL APPOINTMENTS */}
      <section className="card">
        <div className="card-head">
          <h2>All appointments</h2>
        </div>

        {appointments.length === 0 ? (
          <Empty title="No appointments found" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="cell-main">{appointment.patientName}</td>
                    <td>{formatDate(appointment.appointmentDate)}</td>
                    <td className="num">
                      {shortTime(appointment.appointmentTime)}
                    </td>
                    <td>
                      <StatusBadge status={appointment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default DoctorDashboard;
