import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e)=>{
    e.preventDefault(); 
    setError(null);
    setIsLoading(true);
    
    try{ 
      await login(email,password); 
      navigate("/"); 
    }catch{ 
      setError("Invalid login credentials. Please try again."); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card auth">
        <h2>Welcome Back</h2>
        <p className="hint">Sign in to your account to continue managing your tasks.</p>
        {error && <div className="error">{error}</div>}
        <form className="row" onSubmit={submit}>
          <input 
            type="email" 
            placeholder="Enter your email" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            required
            disabled={isLoading}
          />
          <input 
            type="password" 
            placeholder="Enter your password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            required
            disabled={isLoading}
          />
          <button 
            className="btn btn-primary" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
          <div style={{textAlign:"center", color:"var(--muted)", marginTop: "8px"}}>
            Don't have an account? <Link className="nav-link" to="/register">Create one here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
