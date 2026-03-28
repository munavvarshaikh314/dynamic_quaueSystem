

import React, { useEffect, useState } from "react";

export default function AdminDashboard() {
  // ---------------- GLOBAL STATES ----------------
 // const [mode, setMode] = useState("admin"); // admin | customer
  const [mode, setMode] = useState("customer"); 
// customer | staff | owner

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: "", password: "" });

  // admin data
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [ownerAuth, setOwnerAuth] = useState(false);
const [ownerCreds, setOwnerCreds] = useState({ email: "", password: "" });

  // customer booking
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState(null);


  useEffect(() => {
  const t = localStorage.getItem("token");
  if (t) setIsAuthenticated(true);
}, []);
  // ---------------- LOGIN ----------------
  const handleLogin = async (e) => {
  e.preventDefault();

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: credentials.username,
      password: credentials.password,
    }),
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("token", data.token);
    setIsAuthenticated(true);
  } else {
    alert(data.message || "Invalid credentials");
  }
};


const ownerLogin = async (e) => {
  e.preventDefault();

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ownerCreds),
  });

  const data = await res.json();
  console.log("OWNER LOGIN:", data);

  if (res.ok) {
    localStorage.setItem("token", data.token);
    setOwnerAuth(true);
  } else {
    alert(data.message);
  }
};

  // ---------------- FETCH APPOINTMENTS ----------------
 const fetchAppointments = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("token");

    const res = await fetch("/api/admin/appointments", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Invalid response:", data);
      setAppointments([]);
      setFilteredAppointments([]);
      return;
    }

    setAppointments(data);
    setFilteredAppointments(data);

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (isAuthenticated && mode === "staff") fetchAppointments();
  }, [isAuthenticated, mode]);

  // auto refresh every 5s
  useEffect(() => {
    if (!isAuthenticated || mode !== "staff") return;
    const interval = setInterval(fetchAppointments, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, mode]);

  // ---------------- FILTER ----------------
  useEffect(() => {
    let filtered = appointments;

    if (search) {
      filtered = filtered.filter(
        (appt) =>
          appt.tokenNumber.toString().includes(search) ||
          appt.contactValue.includes(search)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((appt) => appt.status === statusFilter);
    }

    setFilteredAppointments(filtered);
  }, [search, statusFilter, appointments]);

  // ---------------- ADMIN ACTIONS ----------------
  const markServed = async (id) => {
  const token = localStorage.getItem("token");

  await fetch(`/api/admin/appointments/${id}/serve`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });

  fetchAppointments();
};

 const notifyNow = async (id) => {
  const token = localStorage.getItem("token");

  await fetch(`/api/admin/appointments/${id}/notify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  alert("Notification sent");
  fetchAppointments();
};

 const deleteToken = async (id) => {
  if (!confirm("Cancel this token?")) return;

  const token = localStorage.getItem("token");

  await fetch(`/api/admin/appointments/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  fetchAppointments();
};

  // ---------------- CUSTOMER BOOK ----------------
  const [prefix, setPrefix] = useState("A");
 const book = async () => {
  try {
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        contactType: "phone",
        contactValue: phone,
        prefix: prefix
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Booking failed");
      return;
    }

    if (!phone || phone.length < 8) {
  alert("Enter valid phone number");
  return;
}

    setToken(data);
  } catch (err) {
    alert("Server not reachable");
    console.error(err);
  }
};
  // ---------------- MODE SWITCH ----------------
 const ModeSwitcher = (
  <div className="flex gap-3 justify-center mt-4 flex-wrap">
    <button onClick={() => setMode("customer")} className="bg-purple-600 text-white px-4 py-2 rounded">
      Customer
    </button>
    <button onClick={() => setMode("staff")} className="bg-gray-700 text-white px-4 py-2 rounded">
      Staff
    </button>
    <button onClick={() => setMode("owner")} className="bg-blue-700 text-white px-4 py-2 rounded">
      Owner
    </button>
  </div>
);

  // ---------------- CUSTOMER UI ----------------
  if (mode === "customer") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        {ModeSwitcher}
        <h1 className="text-3xl font-bold">Take a Token</h1>

        <input className="border p-2 rounded" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="border p-2 rounded" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            
            <select
  className="border p-2 rounded"
  value={prefix}
  onChange={(e) => setPrefix(e.target.value)}
>
  <option value="A">Haircut (A)</option>
  <option value="B">Beard (B)</option>
  <option value="V">VIP (V)</option>
</select>
        <button onClick={book} className="bg-green-600 text-white px-4 py-2 rounded">
          Get Token
        </button>

        {token && (
  <div className="bg-white shadow p-4 rounded text-center">
    <h2 className="text-2xl font-bold">Token {token.tokenLabel}</h2>
    <p>Time: {new Date(token.appointmentTime).toLocaleTimeString()}</p>

    <button
      className="mt-3 bg-gray-600 text-white px-4 py-1 rounded"
      onClick={() => setToken(null)}
    >
      New Booking
    </button>
  </div>
)}
      </div>
    );
  }

  if (mode === "owner" && !ownerAuth) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={ownerLogin} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Shop Owner Login</h2>
        {ModeSwitcher}

        <input
          type="email"
          placeholder="Owner Email"
          className="w-full border p-2 rounded mb-4"
          value={ownerCreds.email}
          onChange={(e) => setOwnerCreds({ ...ownerCreds, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded mb-4"
          value={ownerCreds.password}
          onChange={(e) => setOwnerCreds({ ...ownerCreds, password: e.target.value })}
          required
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Login
        </button>
      </form>
    </div>
  );
}

if (mode === "owner" && ownerAuth) {
  return <OwnerSettings />;
}

  // ---------------- LOGIN UI ----------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
          {ModeSwitcher}

          <input type="text" placeholder="Username" className="w-full border p-2 rounded mb-4" value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} required />

          <input type="password" placeholder="Password" className="w-full border p-2 rounded mb-4" value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} required />

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Login</button>
        </form>
      </div>
    );
  }

  // ---------------- DASHBOARD ----------------
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {ModeSwitcher}
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center md:text-left">Admin Appointment Dashboard</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input type="text" placeholder="Search by token or contact" className="border p-2 rounded w-full md:w-1/2" value={search}
          onChange={(e) => setSearch(e.target.value)} />

        <select className="border p-2 rounded w-full md:w-1/4" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="waiting">Waiting</option>
          <option value="notified">Notified</option>
          <option value="served">Served</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border rounded-lg">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">Token</th>
                <th className="border p-2">Contact</th>
                <th className="border p-2">Time</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(filteredAppointments) ? filteredAppointments : []).map((appt) => (
                <tr key={appt._id} className="text-center">
                  <td className="font-bold text-lg">{appt.tokenLabel}</td>
                  <td className="border p-2 break-all">{appt.contactValue}</td>
                  <td className="border p-2">{new Date(appt.appointmentTime).toLocaleTimeString()}</td>
                  <td className="border p-2 capitalize">{appt.status}</td>
                  <td className="border p-2 flex flex-col md:flex-row gap-2 justify-center">
                    <button onClick={() => markServed(appt._id)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Served</button>
                    <button onClick={() => notifyNow(appt._id)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Notify</button>
                    <button
  onClick={() => deleteToken(appt._id)}
  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
>
  Delete
</button>
                  </td>
                </tr>
              ))}

              
            </tbody>
          </table>
        </div>
      )}
    </div>

    
  );

 
}

function OwnerSettings() {
  const [form, setForm] = useState({
    shopName: "",
    openTime: "09:00",
    closeTime: "18:00",
    slotDuration: 10,
    tokenPrefix: "A",
  });

  useEffect(() => {
  const load = async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setForm(data);
  };
  load();
}, []);

  const save = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/settings", {
      method: "PUT",   // ✅ CORRECT METHOD
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // REQUIRED (auth middleware)
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to save settings");
      return;
    }

    alert("Settings saved successfully!");
  } catch (err) {
    console.error(err);
    alert("Server error while saving settings");
  }
};

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">

      <h1 className="text-2xl font-bold text-center">Shop Settings</h1>

      <input
        className="border p-2 w-full rounded"
        value={form.shopName}
        onChange={(e) => setForm({ ...form, shopName: e.target.value })}
        placeholder="Shop Name"
      />

      <input
        type="time"
        className="border p-2 w-full rounded"
        value={form.openTime}
        onChange={(e) => setForm({ ...form, openTime: e.target.value })}
      />

      <input
        type="time"
        className="border p-2 w-full rounded"
        value={form.closeTime}
        onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
      />

      <input
        type="number"
        className="border p-2 w-full rounded"
        value={form.slotDuration}
        onChange={(e) => setForm({ ...form, slotDuration: e.target.value })}
        placeholder="Slot Duration"
      />

      <input
        className="border p-2 w-full rounded"
        value={form.tokenPrefix}
        onChange={(e) => setForm({ ...form, tokenPrefix: e.target.value })}
        placeholder="Token Prefix"
      />

      <button
        onClick={save}
        className="w-full bg-green-600 text-white py-2 rounded"
      >
        Save Settings
      </button>

    </div>
  );
}