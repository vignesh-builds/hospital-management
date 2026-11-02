import { BrandMark } from "./ui/Icons";

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth">
      <aside className="auth-aside">
        <div className="brand" style={{ padding: 0 }}>
          <span className="brand-mark">
            <BrandMark />
          </span>
          CarePoint
        </div>

        <div>
          <h2>Appointments, doctors and patients in one place.</h2>
          <p>
            Secure access for patients, doctors and hospital administrators.
          </p>
        </div>

        <div className="auth-foot">© 2026 CarePoint Hospital Management</div>
      </aside>

      <main className="auth-main">
        <div className="auth-panel">
          <h1>{title}</h1>
          <p className="page-sub">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthShell;
