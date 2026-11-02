import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { getUser } from "../utils/auth";
import { formatDateTime, formatMoney, stayDays } from "../utils/format";
import useApiData from "../utils/useApiData";
import {
  Alert,
  Empty,
  Field,
  PageHeader,
  StatCard,
  StatusBadge,
} from "../components/ui";
import "./medical.css";

export default function Beds() {
  const user = getUser();
  const role = user?.role;
  const isAdmin = role === "ADMIN";
  const isStaff = ["ADMIN","DOCTOR","RECEPTIONIST","NURSE","WARD_IN_CHARGE"].includes(role);
  const canAdmit = ["ADMIN","DOCTOR","RECEPTIONIST","WARD_IN_CHARGE"].includes(role);
  const canReserve = ["ADMIN","RECEPTIONIST","WARD_IN_CHARGE"].includes(role);
  const canTransfer = ["ADMIN","RECEPTIONIST","NURSE","WARD_IN_CHARGE"].includes(role);
  const canMaintenance = ["ADMIN","WARD_IN_CHARGE"].includes(role);

  const bedsData = useApiData("/beds");
  const patientsData = useApiData(isStaff ? "/patients" : null);
  const admissionsData = useApiData(isStaff ? "/admissions" : null);
  const transfersData = useApiData(["ADMIN","WARD_IN_CHARGE"].includes(role) ? "/beds/transfers" : null);

  const beds = bedsData.data || [];
  const patients = patientsData.data || [];
  const admissions = admissionsData.data || [];

  const [newBed, setNewBed] = useState({ bedNumber: "", wardType: "GENERAL", dailyRate: "500" });
  const [admitBedId, setAdmitBedId] = useState(null);
  const [admitForm, setAdmitForm] = useState({ patientId: "", reason: "" });
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [lastBillId, setLastBillId] = useState(null);
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("ALL");
  const [editingBedId, setEditingBedId] = useState(null);
  const [editBed, setEditBed] = useState({ bedNumber: "", wardType: "GENERAL", dailyRate: "500" });
  const [reservePatient, setReservePatient] = useState("");
  const [transferTarget, setTransferTarget] = useState({});
  const [transferReason, setTransferReason] = useState({});

  const error =
    actionError || bedsData.error || patientsData.error || admissionsData.error;

  const occupiedCount = beds.filter((b) => b.occupied).length;
  const admittedPatientIds = new Set(
    beds.map((b) => b.patientId).filter(Boolean)
  );
  const freePatients = patients.filter((p) => !admittedPatientIds.has(p.id));
  const filteredBeds = beds.filter((bed) => {
    const matchesSearch = `${bed.bedNumber} ${bed.wardType} ${bed.patientName || ""}`
      .toLowerCase().includes(search.toLowerCase());
    const matchesWard = wardFilter === "ALL" || bed.wardType === wardFilter;
    return matchesSearch && matchesWard;
  });

  const reloadAll = () => {
    bedsData.reload();
    admissionsData.reload();
  };

  const resetMessages = () => {
    setActionError("");
    setMessage("");
    setLastBillId(null);
  };

  const handleCreateBed = async (event) => {
    event.preventDefault();
    resetMessages();
    try {
      await apiRequest("/beds", {
        method: "POST",
        body: JSON.stringify({
          bedNumber: newBed.bedNumber.trim(),
          wardType: newBed.wardType,
          dailyRate: Number(newBed.dailyRate) || 0,
        }),
      });
      setNewBed({ ...newBed, bedNumber: "" });
      setMessage("Bed added.");
      bedsData.reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const startEditBed = (bed) => {
    setEditingBedId(bed.id);
    setEditBed({ bedNumber: bed.bedNumber, wardType: bed.wardType || "GENERAL", dailyRate: String(bed.dailyRate ?? 0) });
    resetMessages();
  };

  const handleUpdateBed = async (event) => {
    event.preventDefault();
    try {
      await apiRequest(`/beds/${editingBedId}`, {
        method: "PUT",
        body: JSON.stringify({
          bedNumber: editBed.bedNumber.trim(),
          wardType: editBed.wardType,
          dailyRate: Number(editBed.dailyRate),
        }),
      });
      setEditingBedId(null);
      setMessage("Bed details updated.");
      bedsData.reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDeleteBed = async (bed) => {
    if (!window.confirm(`Delete bed ${bed.bedNumber}? Beds with admission history cannot be deleted.`)) return;
    try {
      await apiRequest(`/beds/${bed.id}`, { method: "DELETE" });
      setMessage("Bed deleted.");
      bedsData.reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleAdmit = async (event) => {
    event.preventDefault();
    resetMessages();
    try {
      await apiRequest("/admissions", {
        method: "POST",
        body: JSON.stringify({
          patientId: Number(admitForm.patientId),
          bedId: admitBedId,
          reason: admitForm.reason,
        }),
      });
      setMessage("Patient admitted.");
      setAdmitBedId(null);
      setAdmitForm({ patientId: "", reason: "" });
      reloadAll();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleReserve = async (bed) => {
    try { await apiRequest(`/beds/${bed.id}/reserve`, {method:"POST",body:JSON.stringify({patientId:Number(reservePatient),reservedUntil:null})}); setReservePatient(""); setMessage("Bed reserved."); reloadAll(); }
    catch(err){setActionError(err.message);}
  };
  const handleMaintenance = async (bed, enabled) => {
    try { await apiRequest(`/beds/${bed.id}/maintenance?enabled=${enabled}`,{method:"PUT"}); bedsData.reload(); }
    catch(err){setActionError(err.message);}
  };
  const handleTransfer = async (bed) => {
    try { await apiRequest("/beds/transfer",{method:"POST",body:JSON.stringify({admissionId:bed.admissionId,toBedId:Number(transferTarget[bed.id]),reason:transferReason[bed.id]||""})}); setMessage("Patient transferred successfully."); reloadAll(); }
    catch(err){setActionError(err.message);}
  };

  const handleDischarge = async (bed) => {
    if (
      !window.confirm(
        `Discharge ${bed.patientName} from ${bed.bedNumber}? The room charges will be billed.`
      )
    ) {
      return;
    }
    resetMessages();
    try {
      const result = await apiRequest(`/admissions/${bed.admissionId}/discharge`, {
        method: "PUT",
      });
      setMessage(
        `${bed.patientName} discharged. ${result.billedDays} day(s), room charges ${formatMoney(
          result.roomCharges
        )}.`
      );
      setLastBillId(result.billId);
      reloadAll();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Only for beds blocked by hand (no admitted patient)
  const handleRelease = async (bed) => {
    resetMessages();
    try {
      await apiRequest(`/beds/${bed.id}/status?occupied=false`, { method: "PUT" });
      bedsData.reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Bed management"
        subtitle="Admit and discharge inpatients, room charges are billed automatically"
      />

      <Alert>{error}</Alert>
      <Alert type="success">
        {message}
        {lastBillId && isAdmin && (
          <>
            {" "}
            <Link to={`/invoice/${lastBillId}`}>View bill</Link>
          </>
        )}
      </Alert>

      <div className="stats">
        <StatCard label="Total beds" value={beds.length} />
        <StatCard label="Available" value={beds.length - occupiedCount} tone="ok" />
        <StatCard label="Occupied" value={occupiedCount} tone="danger" />
      <StatCard label="Reserved" value={beds.filter((b) => b.status === "RESERVED").length} />
      <StatCard label="Maintenance" value={beds.filter((b) => b.status === "MAINTENANCE").length} />
      </div>

      {isAdmin && (
        <section className="card section">
          <div className="card-head">
            <h2>Add new bed</h2>
          </div>
          <form className="card-body form-grid" onSubmit={handleCreateBed}>
            <Field label="Bed number">
              <input
                className="input"
                placeholder="e.g. ICU-05 or GW-12"
                value={newBed.bedNumber}
                onChange={(e) => setNewBed({ ...newBed, bedNumber: e.target.value })}
                required
              />
            </Field>
            <Field label="Ward type">
              <select
                className="select"
                value={newBed.wardType}
                onChange={(e) => setNewBed({ ...newBed, wardType: e.target.value })}
              >
                <option value="GENERAL">General ward</option>
                <option value="SEMI_PRIVATE">Semi-private</option>
                <option value="ICU">ICU</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </Field>
            <Field label="Daily rate (₹)">
              <input
                className="input"
                type="number"
                min="0"
                value={newBed.dailyRate}
                onChange={(e) => setNewBed({ ...newBed, dailyRate: e.target.value })}
                required
              />
            </Field>
            <button type="submit" className="btn">
              Add bed
            </button>
          </form>
        </section>
      )}

      <section className="card section">
        <div className="form-grid">
          <Field label="Search beds">
            <input className="input" placeholder="Bed number, ward or patient" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Field>
          <Field label="Filter by ward">
            <select className="select" value={wardFilter} onChange={(e) => setWardFilter(e.target.value)}>
              <option value="ALL">All wards</option>
              <option value="GENERAL">General</option>
              <option value="SEMI_PRIVATE">Semi-private</option>
              <option value="ICU">ICU</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </Field>
        </div>
      </section>

      {beds.length === 0 ? (
        <section className="card section">
          <Empty title="No beds configured yet" />
        </section>
      ) : filteredBeds.length === 0 ? (
        <section className="card section"><Empty title="No beds match your search" /></section>
      ) : (
        <div className="bed-grid">
          {filteredBeds.map((bed) => (
            <div key={bed.id} className={`bed-card${bed.occupied ? " is-occupied" : ""}`}>
              <div>
                <div className="bed-top">
                  <h3>{bed.bedNumber}</h3>
                  <span className={`badge ${bed.occupied ? "badge-cancelled" : "badge-completed"}`}>
                    {bed.status || (bed.occupied ? "OCCUPIED" : "AVAILABLE")}
                  </span>
                </div>
                <p className="bed-line">
                  {bed.wardType} · {formatMoney(bed.dailyRate)} / day
                </p>
                {bed.status === "RESERVED" && <p className="bed-line">Reserved for: {bed.reservedPatientName || "Patient"}</p>}
                {isStaff && bed.occupied && bed.patientName && (
                  <>
                    <p className="bed-line">
                      <strong>{bed.patientName}</strong>
                    </p>
                    <p className="bed-line">Since {formatDateTime(bed.admittedAt)}</p>
                    <p className="bed-line">
                      Running: {stayDays(bed.admittedAt)} day(s) ≈{" "}
                      {formatMoney(stayDays(bed.admittedAt) * Number(bed.dailyRate || 0))}
                    </p>
                  </>
                )}
                {isStaff && bed.occupied && !bed.patientName && (
                  <p className="bed-line">Blocked (no patient)</p>
                )}
              </div>

              {isAdmin && editingBedId === bed.id && (
                <form className="bed-admit" onSubmit={handleUpdateBed}>
                  <input className="input" value={editBed.bedNumber} onChange={(e) => setEditBed({ ...editBed, bedNumber: e.target.value })} placeholder="Bed number" required />
                  <select className="select" value={editBed.wardType} onChange={(e) => setEditBed({ ...editBed, wardType: e.target.value })}>
                    <option value="GENERAL">General ward</option><option value="SEMI_PRIVATE">Semi-private</option><option value="ICU">ICU</option><option value="EMERGENCY">Emergency</option>
                  </select>
                  <input className="input" type="number" min="0" value={editBed.dailyRate} onChange={(e) => setEditBed({ ...editBed, dailyRate: e.target.value })} required />
                  <div className="btn-row">
                    <button className="btn btn-sm" type="submit">Save changes</button>
                    <button className="btn btn-sm btn-secondary" type="button" onClick={() => setEditingBedId(null)}>Cancel</button>
                  </div>
                </form>
              )}
              {isAdmin && !bed.occupied && editingBedId !== bed.id && (
                <div className="btn-row">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => startEditBed(bed)}>Edit bed</button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleDeleteBed(bed)}>Delete bed</button>
                </div>
              )}

              {canMaintenance && !bed.occupied && bed.status !== "RESERVED" && (
                <button className="btn btn-sm btn-secondary" type="button" onClick={() => handleMaintenance(bed,bed.status !== "MAINTENANCE")}>{bed.status === "MAINTENANCE" ? "Mark available" : "Set maintenance"}</button>
              )}
              {canReserve && bed.status === "AVAILABLE" && (
                <div className="bed-admit"><select className="select" value={reservePatient} onChange={e=>setReservePatient(e.target.value)}><option value="">Select patient to reserve</option>{patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="btn btn-sm" type="button" disabled={!reservePatient} onClick={()=>handleReserve(bed)}>Reserve bed</button></div>
              )}
              {canReserve && bed.status === "RESERVED" && <button className="btn btn-sm btn-secondary" type="button" onClick={async()=>{try{await apiRequest(`/beds/${bed.id}/reservation`,{method:"DELETE"});bedsData.reload();}catch(e){setActionError(e.message);}}}>Cancel reservation</button>}
              {canTransfer && bed.occupied && bed.admissionId && (
                <div className="bed-admit"><select className="select" value={transferTarget[bed.id]||""} onChange={e=>setTransferTarget({...transferTarget,[bed.id]:e.target.value})}><option value="">Transfer to available bed</option>{beds.filter(x=>x.status==="AVAILABLE"&&!x.occupied).map(x=><option key={x.id} value={x.id}>{x.bedNumber}</option>)}</select><input className="input" placeholder="Transfer reason" value={transferReason[bed.id]||""} onChange={e=>setTransferReason({...transferReason,[bed.id]:e.target.value})}/><button className="btn btn-sm" type="button" disabled={!transferTarget[bed.id]} onClick={()=>handleTransfer(bed)}>Transfer patient</button></div>
              )}
              {canAdmit && bed.occupied && bed.admissionId && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleDischarge(bed)}
                >
                  Discharge &amp; bill
                </button>
              )}

              {isStaff && bed.occupied && !bed.admissionId && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleRelease(bed)}
                >
                  Mark available
                </button>
              )}

              {canAdmit && !bed.occupied && bed.status === "AVAILABLE" && admitBedId !== bed.id && (
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={() => {
                    resetMessages();
                    setAdmitBedId(bed.id);
                  }}
                >
                  Admit patient
                </button>
              )}

              {canAdmit && !bed.occupied && bed.status === "AVAILABLE" && admitBedId === bed.id && (
                <form className="bed-admit" onSubmit={handleAdmit}>
                  <select
                    className="select"
                    value={admitForm.patientId}
                    onChange={(e) => setAdmitForm({ ...admitForm, patientId: e.target.value })}
                    required
                  >
                    <option value="">Select patient</option>
                    {freePatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.phone})
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    placeholder="Reason for admission"
                    value={admitForm.reason}
                    onChange={(e) => setAdmitForm({ ...admitForm, reason: e.target.value })}
                  />
                  <div className="btn-row">
                    <button type="submit" className="btn btn-sm btn-success">
                      Admit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => setAdmitBedId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {["ADMIN","WARD_IN_CHARGE"].includes(role) && (
        <section className="card section">
          <div className="card-head"><h2>Bed transfer history</h2></div>
          {(transfersData.data || []).length === 0 ? <Empty title="No bed transfers recorded" /> : (
            <div className="table-wrap"><table className="table"><thead><tr><th>Patient</th><th>From</th><th>To</th><th>Transferred at</th><th>Reason</th></tr></thead>
            <tbody>{transfersData.data.map(t=><tr key={t.id}><td>{t.patient}</td><td>{t.from}</td><td>{t.to}</td><td>{formatDateTime(t.at)}</td><td>{t.reason || "-"}</td></tr>)}</tbody></table></div>
          )}
        </section>
      )}

      {isStaff && (
        <section className="card">
          <div className="card-head">
            <h2>Admission log</h2>
          </div>
          {admissions.length === 0 ? (
            <Empty title="No admissions yet" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Bed</th>
                    <th>Admitted</th>
                    <th>Discharged</th>
                    <th className="num">Days</th>
                    {isAdmin && <th className="num">Room charges</th>}
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.slice(0, 15).map((a) => (
                    <tr key={a.id}>
                      <td className="cell-main">
                        {a.patientName}
                        <div className="cell-sub">{a.reason}</div>
                      </td>
                      <td>{a.bedNumber}</td>
                      <td>{formatDateTime(a.admittedAt)}</td>
                      <td>{formatDateTime(a.dischargedAt) || "-"}</td>
                      <td className="num">{a.billedDays ?? "-"}</td>
                      {isAdmin && (
                        <td className="num">
                          {a.roomCharges != null ? formatMoney(a.roomCharges) : "-"}
                        </td>
                      )}
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
