import React, { useState } from "react";
import CustomInput from "../components/shared/CustomInput";
import CustomButton from "../components/ui/CustomButton";

// This prop is passed by the "gate" component to reload the app
type Props = {
  onSuccess: () => void;
};

export const DatabaseSetupView: React.FC<Props> = ({ onSuccess }) => {
  const [creds, setCreds] = useState({
    host: "localhost",
    port: 5432,
    database: "restaurant_pos",
    user: "pos_admin",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreds({ ...creds, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await (window as any).electronAPI.saveAndInitDb(creds);

    setLoading(false);
    if (result.success) {
      onSuccess(); // Tell the parent to show the main app
    } else {
      setError("Failed to connect to the database.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-white rounded shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-4">Database Connection</h2>
        <p className="mb-4 text-sm text-gray-600">
          Please enter your PostgreSQL credentials to continue.
        </p>

        <CustomInput
        label="Host"
        name="host"
        value={creds.host}
        onChange={handleChange}
        type="text"
        />
        <CustomInput
        label="Port"
        name="port"
        value={creds.port}
        onChange={handleChange}
        type="number"
        />
        <CustomInput
        label="Database"
        name="database"
        value={creds.database}
        onChange={handleChange}
        type="text"
        />
        <CustomInput
        label="User"
        name="user"
        value={creds.user}
        onChange={handleChange}
        type="text"
        />
        <CustomInput
        label="Password"
        name="password"
        value={creds.password}
        onChange={handleChange}
        type="password"
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <CustomButton
            type="submit"
            disabled={loading}
            label={ loading? "Connecting...": "Save & Connect" }
            variant="primary"
            className="w-full mt-4"
        />
      </form>
    </div>
  );
};