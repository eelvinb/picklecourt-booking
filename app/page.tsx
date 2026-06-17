"use client";

import { useState } from "react";

export default function Home() {

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showCourts, setShowCourts] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");

  const courts = [
  {
    id: 1,
    name: "Court 1",
    type: "Indoor Court",
    available: true,
  },
  {
    id: 2,
    name: "Court 2",
    type: "Outdoor Court",
    available: false,
  },
  {
    id: 3,
    name: "Court 3",
    type: "Indoor Court",
    available: true,
  },
  ];

const handleCheck = () => {
  if (!date || !startTime || !endTime) {
    alert("Please select date, start time, and end time.");
    return;
  }

  setShowCourts(true);

  console.log("Booking check:", {
    date,
    startTime,
    endTime,
  });
};

const handleConfirmBooking = () => {
  if (!selectedCourt || !customerName || !customerContact) {
    alert("Please complete all booking details.");
    return;
  }

  console.log("Final Booking:", {
    date,
    startTime,
    endTime,
    selectedCourt,
    customerName,
    customerContact,
  });

  alert("Booking submitted!");

  setDate("");
  setStartTime("");
  setEndTime("");
  setSelectedCourt(null);
  setCustomerName("");
  setCustomerContact("");
  setShowCourts(false);
};

  return (

    <main className="min-h-screen bg-slate-950 text-white">

      <section className="max-w-6xl mx-auto px-6 py-16">

        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">
            PickleCourt Booking
          </h1>

          <p className="text-slate-300 text-lg">
            Reserve your pickleball court online in seconds.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">

          {/* LEFT SIDE */}
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800">

            <h2 className="text-2xl font-semibold mb-6">
              Book a Court
            </h2>

            <div className="space-y-4">

              <div>
                <label className="block mb-2 text-sm text-slate-400">
                  Select Date
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    console.log("date changed:", e.target.value);
                    setDate(e.target.value);
                  }}
                  className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-slate-400">
                  Start Time
                </label>

                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-slate-400">
                  End Time
                </label>

                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700"
                />
              </div>

              <button
                onClick={handleCheck}
                className="w-full bg-green-500 hover:bg-green-600 transition p-4 rounded-xl font-semibold">
                Check Available Courts
              </button>

            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800">

            <h2 className="text-2xl font-semibold mb-6">
              Available Courts
            </h2>

            {showCourts ? (
              <div className="space-y-4">

                {courts.map((court) => (

                  <div
                    key={court.id}
                    className={`bg-slate-800 p-5 rounded-2xl flex justify-between items-center ${
                      !court.available && "opacity-60"
                    }`}
                  >

                    <div>
                      <h3 className="font-semibold">{court.name}</h3>

                      <p className="text-sm text-slate-400">
                        {court.type}
                      </p>
                    </div>

                    {court.available ? (
                      <button
                        onClick={() => setSelectedCourt(court.name)}
                        className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-full text-sm">
                        Book
                      </button>
                    ) : (
                      <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm">
                        Booked
                      </span>
                    )}

                  </div>

                ))}

              </div>
                    ) : (
                      <p className="text-slate-400">
                        Select date and time first, then check available courts.
                      </p>
                    )}

              {selectedCourt && (
                <div className="mt-6 space-y-4">
                  <p className="text-green-400 font-semibold">
                    Selected Court: {selectedCourt}
                  </p>
                  
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700"
                  />

                  <input
                    type="text"
                    placeholder="Contact Number"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700"
                  />

                  <button
                    onClick={handleConfirmBooking}
                    className="w-full bg-blue-500 hover:bg-blue-600 transition p-4 rounded-xl font-semibold"
                  >
                    Confirm Booking
                  </button>
                </div>
              )}

          </div>
        </div>  

      </section>

    </main>
  );
}