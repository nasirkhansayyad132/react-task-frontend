import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState(null);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await register(name, email, password, passwordConfirmation);
            navigate('/login');
        } catch (err) {
            if (err.response && err.response.data.errors) {
                const messages = Object.values(err.response.data.errors).flat();
                setError(messages.join(' '));
            } else {
                setError('Registration failed. Please try again.');
            }
        }
    };

    return (
        <div className="container">
            <div className="card auth">
                <h2>Create Account</h2>
                <p className="hint">Join us to start managing your tasks efficiently.</p>
                {error && <div className="error">{error}</div>}
                <form className="row" onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Full Name" 
                        required 
                    />
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="Email Address" 
                        required 
                    />
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Password" 
                        required 
                    />
                    <input 
                        type="password" 
                        value={passwordConfirmation} 
                        onChange={(e) => setPasswordConfirmation(e.target.value)} 
                        placeholder="Confirm Password" 
                        required 
                    />
                    <button className="btn btn-primary" type="submit">Create Account</button>
                    <div style={{textAlign: "center", color: "var(--muted)"}}>
                        Already have an account? <Link className="nav-link" to="/login">Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;