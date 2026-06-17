"use client";

import { useState } from "react";

export default function Home() {

const [date, setDate] = useState("");
const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
const [showCourts, setShowCourts] = useState(false);
const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
const [customerName, setCustomerName] = useState("");
const [customerContact, setCustomerContact] = useState("");
const [bookings, setBookings] = useState<any[]>([]);
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

 const availableCourts = courts.filter((court) => {
  const alreadyBooked = bookings.some(
    (booking) =>
      booking.date === date &&
      booking.time === selectedTimeSlot &&
      booking.court === court.name
  );

  return court.available && !alreadyBooked;
}); 

const handleCheck = () => {
  if (!date || !selectedTimeSlot) {
    alert("Please select a date and time slot first.");
    return;
  }

  setShowCourts(true);

  console.log("Booking check:", {
    date,
    selectedTimeSlot,
  });
};

const handleConfirmBooking = () => {
  if (!date || !selectedTimeSlot || !selectedCourt || !customerName || !customerContact) {
    alert("Please complete all booking details.");
    return;
  }

  const newBooking = {
    date,
    time: selectedTimeSlot,
    court: selectedCourt,
    name: customerName,
    contact: customerContact,
  };

  setBookings([...bookings, newBooking]);

  alert("Booking confirmed!");

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
                <label className="block mb-2 text-sm text-slate-300">
                  Select Time
                </label>

                <select
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700"
                  disabled={!date}
                >


                  <option value="" disabled hidden>
                    Select a date first
                  </option>

                  <optgroup label="Early Morning">
                    <option value="12:00 AM">12:00 AM - 1:00 AM</option>
                    <option value="1:00 AM">1:00 AM - 2:00 AM</option>
                    <option value="2:00 AM">2:00 AM - 3:00 AM</option>
                    <option value="3:00 AM">3:00 AM - 4:00 AM</option>
                    <option value="4:00 AM">4:00 AM - 5:00 AM</option>
                    <option value="5:00 AM">5:00 AM - 6:00 AM</option>
                  </optgroup>

                  <optgroup label="Morning">
                    <option value="6:00 AM">6:00 AM - 7:00 AM</option>
                    <option value="7:00 AM">7:00 AM - 8:00 AM</option>
                    <option value="8:00 AM">8:00 AM - 9:00 AM</option>
                    <option value="9:00 AM">9:00 AM - 10:00 AM</option>
                    <option value="10:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="11:00 AM">11:00 AM - 12:00 AM</option>
                  </optgroup>

                  <optgroup label="Afternoon">
                    <option value="12:00 PM">12:00 PM - 1:00 PM</option>
                    <option value="1:00 PM">1:00 PM - 2:00 PM</option>
                    <option value="2:00 PM">2:00 PM - 3:00 PM</option>
                    <option value="3:00 PM">3:00 PM - 4:00 PM</option>
                    <option value="4:00 PM">4:00 PM - 5:00 PM</option>
                    <option value="5:00 PM">5:00 PM - 6:00 PM</option>
                  </optgroup>

                  <optgroup label="Evening">
                    <option value="6:00 PM">6:00 PM - 7:00 PM</option>
                    <option value="7:00 PM">7:00 PM - 8:00 PM</option>
                    <option value="8:00 PM">8:00 PM - 9:00 PM</option>
                    <option value="9:00 PM">9:00 PM - 10:00 PM</option>
                  </optgroup>

                  <optgroup label="Late Evening">
                    <option value="10:00 PM">10:00 PM - 11:00 PM</option>
                    <option value="11:00 PM">11:00 PM - 12:00 PM</option>
                  </optgroup>

                </select>
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

            {showCourts && availableCourts.length === 0 && (
              <p className="text-red-400 mt-4">
                No courts available for this date and time.
              </p>
            )}

            {showCourts ? (
              <div className="space-y-4">

                {availableCourts.map((court) => (

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

  {bookings.length > 0 && (
    <div className="mt-8 rounded-xl bg-slate-900 border border-slate-700 p-6">
      <h2 className="text-xl font-bold mb-4">Confirmed Bookings</h2>

      <div className="space-y-3">
        {bookings.map((booking, index) => (
          <div
            key={index}
            className="rounded-lg bg-slate-800 border border-slate-700 p-4"
          >
            <p><strong>Date:</strong> {booking.date}</p>
            <p><strong>Time:</strong> {booking.time}</p>
            <p><strong>Court:</strong> {booking.court}</p>
            <p><strong>Name:</strong> {booking.name}</p>
            <p><strong>Contact:</strong> {booking.contact}</p>
          </div>
        ))}
      </div>
    </div>
  )}

    </main>
  );
}