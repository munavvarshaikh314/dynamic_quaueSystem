// import { useState } from "react";

// export default function BookAppointment() {
//   const [name, setName] = useState("");
//   const [contactValue, setContactValue] = useState("");
//   const [result, setResult] = useState(null);

//   const submitForm = async () => {
//     const res = await fetch("http://localhost:5000/api/appointments", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         name,
//         contactType: "phone",
//         contactValue,
//       }),
//     });

//     const data = await res.json();
//     setResult(data);
//   };

//   return (
//     <div style={{ padding: 40 }}>
//       <h1>Book Appointment</h1>

//       <input
//         placeholder="Your Name"
//         value={name}
//         onChange={(e) => setName(e.target.value)}
//       />
//       <br /><br />

//       <input
//         placeholder="Phone Number"
//         value={contactValue}
//         onChange={(e) => setContactValue(e.target.value)}
//       />
//       <br /><br />

//       <button onClick={submitForm}>Get Token</button>

//       {result && (
//         <div>
//           <h2>Token: {result.tokenNumber}</h2>
//           <p>Time: {new Date(result.appointmentTime).toLocaleTimeString()}</p>
//         </div>
//       )}
//     </div>
//   );
// }