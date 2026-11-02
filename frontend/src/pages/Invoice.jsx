import { Link, useParams } from "react-router-dom";
import { formatDateTime, formatMoney } from "../utils/format";
import useApiData from "../utils/useApiData";
import { Alert, PageHeader, StatusBadge } from "../components/ui";
import "./medical.css";

export default function Invoice() {
  const { billId } = useParams();
  const { data: bill, error } = useApiData(`/bills/${billId}`);

  const lines = bill
    ? [
        { label: "Consultation fee", amount: bill.doctorFee },
        { label: "Room / bed charges", amount: bill.roomCharges },
        { label: "Pharmacy / medicines", amount: bill.medicineCharges },
      ].filter((line) => Number(line.amount) > 0)
    : [];

  return (
    <>
      <PageHeader title={`Invoice #${billId}`}>
        <Link to="/billing" className="btn btn-secondary">
          Back to billing
        </Link>
        {bill && (
          <button type="button" className="btn" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
        )}
      </PageHeader>

      <Alert>{error}</Alert>

      {bill && (
        <article className="sheet">
          <header className="sheet-head">
            <div>
              <h2>CarePoint Hospital</h2>
              <div className="muted">
                {bill.paymentStatus === "PAID" ? "Payment receipt" : "Invoice"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong>#{bill.id}</strong>
              <div className="muted">{formatDateTime(bill.generatedDate)}</div>
              <StatusBadge status={bill.paymentStatus} />
            </div>
          </header>

          <dl className="sheet-meta">
            <div>
              <dt>Billed to</dt>
              <dd>{bill.patient?.name}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{bill.patient?.phone || "-"}</dd>
            </div>
            {bill.paidDate && (
              <div>
                <dt>Paid on</dt>
                <dd>{formatDateTime(bill.paidDate)}</dd>
              </div>
            )}
          </dl>

          {bill.description && <p className="muted">{bill.description}</p>}

          <table className="sheet-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={2}>No charges</td>
                </tr>
              ) : (
                lines.map((line) => (
                  <tr key={line.label}>
                    <td>{line.label}</td>
                    <td className="num">{formatMoney(line.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td className="num">{formatMoney(bill.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </article>
      )}
    </>
  );
}
