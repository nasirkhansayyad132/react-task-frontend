import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="brand">
        <span className="brand-badge" />
        <Link to="/" className="nav-link" style={{ fontSize: "1.25rem", fontWeight: "700" }}>
          TaskFlow
        </Link>
      </div>

      <div className="nav-actions">
        {user ? (
          <>
            <span className="chip">
              Welcome, {user.name}
            </span>
            <button className="btn btn-ghost" onClick={handleLogout}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link className="nav-link" to="/login">Sign In</Link>
            <button className="btn btn-primary" onClick={()=>navigate("/register")}>
              Get Started
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
