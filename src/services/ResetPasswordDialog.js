import { useState }  from "react";
export const ResetPasswordDialog = ({ onClose }) => {
    const [email, setEmail] = useState('');
  
    const handleChange = (e) => {
      setEmail(e.target.value);
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      console.log('Reset password for email:', email);
      onClose(); // Close dialog after submission (for simplicity)
    };
  
    return (
      <div className="dialog-backdrop">
        <div className="dialog">
          <h2>Reset Password</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="resetEmail" className="form-label">Email: </label>
            <input
              type="email"
              id="resetEmail"
              value={email}
              onChange={handleChange}
              required
            />
            <div className="button-container">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="submit">Reset Password</button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  