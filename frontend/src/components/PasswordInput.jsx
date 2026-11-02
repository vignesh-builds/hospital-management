import { useState } from "react";
import { IconEye, IconEyeOff } from "./ui/Icons";

function PasswordInput({ className = "input", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        {...props}
        className={className}
        type={visible ? "text" : "password"}
      />

      <button
        type="button"
        className="password-eye"
        onClick={() => setVisible((previous) => !previous)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}

export default PasswordInput;
