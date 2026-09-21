import { Link, useNavigate } from "react-router-dom";
import { getUser, isLoggedIn, logout } from "../utils/auth";
import "./Navbar.css";

function Navbar() {

  const navigate = useNavigate();

  const user = getUser();
  const loggedIn = isLoggedIn();


  const handleLogout = () => {

    logout();

    navigate("/login");

  };


  if (!loggedIn || !user) {

    return (
      <nav className="navbar">

        <div className="navbar-brand">
          Hospital Management
        </div>

        <div className="navbar-links">

          <Link to="/login">
            Login
          </Link>

          <Link to="/register">
            Register
          </Link>

        </div>

      </nav>
    );
  }


  return (

    <nav className="navbar">

      <div className="navbar-brand">
        Hospital Management
      </div>


      <div className="navbar-links">

        <Link to="/">
          Home
        </Link>


        <Link to="/doctors">
          Doctors
        </Link>


        {user.role === "PATIENT" && (
          <>
            <Link to="/patient-dashboard">
              Dashboard
            </Link>

            <Link to="/appointments">
              Appointments
            </Link>
          </>
        )}


        {user.role === "DOCTOR" && (
          <>
            <Link to="/doctor-dashboard">
              Dashboard
            </Link>

            <Link to="/appointments">
              Appointments
            </Link>
          </>
        )}


        {user.role === "ADMIN" && (
          <>
            <Link to="/admin-dashboard">
              Dashboard
            </Link>

            <Link to="/patients">
              Patients
            </Link>

            <Link to="/appointments">
              Appointments
            </Link>
          </>
        )}


        <span className="user-name">
          {user.name}
        </span>


        <span className="user-role">
          {user.role}
        </span>


        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </nav>
  );
}

export default Navbar;