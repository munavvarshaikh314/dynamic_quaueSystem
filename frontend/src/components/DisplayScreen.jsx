
// this new more clean and more effecient
import React, { useEffect, useState } from "react";
import socket from "../socket";

export default function DisplayScreen() {

  const [appointments, setAppointments] = useState([]);
  const [current, setCurrent] = useState(null);

  const API = import.meta.env.VITE_API_URL;

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${API}/api/display`);

      if (!res.ok) return;

      const data = await res.json();

      setAppointments(data);

      const active =
        data.find(a => a.status === "notified") ||
        data.find(a => a.status === "serving") ||
        data.find(a => a.status === "waiting");

      setCurrent(active || null);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {

    fetchAppointments();

    socket.on("connect", () => {
      console.log("TV Connected:", socket.id);
    });

    socket.on("queueUpdated", fetchAppointments);

    return () => {
      socket.off("queueUpdated");
      socket.off("connect");
    };

  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 gap-10">

      <h1 className="text-5xl font-bold">Now Serving</h1>

      <div className="bg-green-600 rounded-3xl px-16 py-10 shadow-2xl text-center">

        {current ? (
          <>
            <div className="text-8xl font-extrabold">
              {current.tokenLabel}
            </div>
            <div className="text-2xl mt-4">
              Please proceed to counter
            </div>
          </>
        ) : (
          <div className="text-3xl">No active tokens</div>
        )}

      </div>

      <div className="w-full max-w-3xl mt-8">

        <h2 className="text-3xl mb-4">Upcoming Tokens</h2>

        <div className="grid grid-cols-4 gap-4">

          {appointments
            .filter(a => a.status === "waiting")
            .slice(0, 12)
            .map(a => (
              <div key={a._id} className="bg-gray-800 rounded-xl p-4 text-center text-2xl">
                {a.tokenLabel}
              </div>
            ))}

        </div>
      </div>

    </div>
  );
}


// import React, { useEffect, useState } from "react";
// import socket from "../socket";
// export default function DisplayScreen() {
//   const [appointments, setAppointments] = useState([]);
//   const [current, setCurrent] = useState(null);

// const API = import.meta.env.VITE_API_URL;
//   const fetchAppointments = async () => {
//   try {
//     const res = await fetch(`${API}/api/display`);

//     if (!res.ok) {
//       console.error("HTTP Error:", res.status);
//       return;
//     }

//     const text = await res.text();

//     let data;
//     try {
//       data = JSON.parse(text);
//     } catch {
//       console.error("Server did not return JSON:", text);
//       return;
//     }

//     if (!Array.isArray(data)) {
//       console.error("Invalid response:", data);
//       setAppointments([]);
//       return;
//     }

//     setAppointments(data);

//     const active =
//       data.find(a => a.status === "notified") ||
//       data.find(a => a.status === "waiting");

//     setCurrent(active || null);

//   } catch (err) {
//     console.error("Network error:", err);
//   }
// };

//   useEffect(() => {
//   // initial load
//   fetchAppointments();

//   // when connected
//   socket.on("connect", () => {
//     console.log("🟢 TV Connected:", socket.id);
//   });

//   // when server says queue changed
//   socket.on("queueUpdated", () => {
//     console.log("📡 Queue updated — refreshing display");
//     fetchAppointments();
//   });

//   return () => {
//     socket.off("queueUpdated");
//     socket.off("connect");
//   };
// }, []);
//   return (
//     <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 gap-10">
//       <h1 className="text-5xl font-bold">Now Serving</h1>

//       <div className="bg-green-600 rounded-3xl px-16 py-10 shadow-2xl text-center">
//         {current ? (
//           <>
//             <div className="text-8xl font-extrabold">#{current.tokenLabel}</div>
//             <div className="text-2xl mt-4">Please proceed to counter</div>
//           </>
//         ) : (
//           <div className="text-3xl">No active tokens</div>
//         )}
//       </div>

//       <div className="w-full max-w-3xl mt-8">
//         <h2 className="text-3xl mb-4">Upcoming Tokens</h2>
//         <div className="grid grid-cols-4 gap-4">
//           {appointments
//             .filter(a => a.status === "waiting")
//             .slice(0, 12)
//             .map(a => (
//               <div key={a._id} className="bg-gray-800 rounded-xl p-4 text-center text-2xl">
//                 #{a.tokenLabel}
//               </div>
//             ))}
//         </div>
//       </div>
//     </div>
//   );
// }
