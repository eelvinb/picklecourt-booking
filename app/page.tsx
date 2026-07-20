"use client";

import { useRef, useState } from "react";

type Booking = {
  date: string;
  startTime: string;
  endTime: string;
  court: string;
  name: string;
  contact: string;
  email: string;
  amount: number;
  isOvernight: boolean;
  bookingStatus: string;
};

type CalendarBooking = {
  date: string;
  startTime: string;
  endTime: string;
  court: string;
  bookingStatus: string;
};

type BookingDetails = Partial<Booking> & {
  bookingId: string;
};

type CalendarSlotStatus = "available" | "reserved" | "occupied";

const COURTS = [
  { id: 1, name: "Court 1", type: "Indoor Court", available: true },
  { id: 2, name: "Court 2", type: "Outdoor Court", available: true },
  { id: 3, name: "Court 3", type: "Indoor Court", available: true },
  { id: 4, name: "Court 4", type: "Indoor Court", available: true },
  { id: 5, name: "Court 5", type: "Indoor Court", available: true },
];

const PRICE_PER_COURT_PER_HOUR = 100;

export default function Home() {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showCourts, setShowCourts] = useState(false);
  const [selectedCourts, setSelectedCourts] = useState<string[]>([]);
  const [unavailableCourts, setUnavailableCourts] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const availableCourtsRef = useRef<HTMLDivElement>(null);
  const [bookingNumber, setBookingNumber] = useState("");
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] =
    useState<BookingDetails | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const [bookingLookupError, setBookingLookupError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedQr, setSelectedQr] = useState("");
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarDate, setCalendarDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [calendarBookings, setCalendarBookings] = useState<CalendarBooking[]>(
    [],
  );
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [showCalendarFilters, setShowCalendarFilters] = useState(false);
  const [calendarStartFilter, setCalendarStartFilter] = useState("00:00");
  const [calendarEndFilter, setCalendarEndFilter] = useState("24:00");
  const calendarCourts = COURTS.filter((court) => court.available).map(
    (court) => court.name,
  );
  const [selectedCalendarCourts, setSelectedCalendarCourts] =
    useState<string[]>(calendarCourts);
  const paymentReceiptInputRef = useRef<HTMLInputElement>(null);

  const calendarTimeSlots = [
    { label: "12 AM - 1 AM", start: "00:00", end: "01:00" },
    { label: "1 AM - 2 AM", start: "01:00", end: "02:00" },
    { label: "2 AM - 3 AM", start: "02:00", end: "03:00" },
    { label: "3 AM - 4 AM", start: "03:00", end: "04:00" },
    { label: "4 AM - 5 AM", start: "04:00", end: "05:00" },
    { label: "5 AM - 6 AM", start: "05:00", end: "06:00" },
    { label: "6 AM - 7 AM", start: "06:00", end: "07:00" },
    { label: "7 AM - 8 AM", start: "07:00", end: "08:00" },
    { label: "8 AM - 9 AM", start: "08:00", end: "09:00" },
    { label: "9 AM - 10 AM", start: "09:00", end: "10:00" },
    { label: "10 AM - 11 AM", start: "10:00", end: "11:00" },
    { label: "11 AM - 12 NN", start: "11:00", end: "12:00" },
    { label: "12 NN - 1 PM", start: "12:00", end: "13:00" },
    { label: "1 PM - 2 PM", start: "13:00", end: "14:00" },
    { label: "2 PM - 3 PM", start: "14:00", end: "15:00" },
    { label: "3 PM - 4 PM", start: "15:00", end: "16:00" },
    { label: "4 PM - 5 PM", start: "16:00", end: "17:00" },
    { label: "5 PM - 6 PM", start: "17:00", end: "18:00" },
    { label: "6 PM - 7 PM", start: "18:00", end: "19:00" },
    { label: "7 PM - 8 PM", start: "19:00", end: "20:00" },
    { label: "8 PM - 9 PM", start: "20:00", end: "21:00" },
    { label: "9 PM - 10 PM", start: "21:00", end: "22:00" },
    { label: "10 PM - 11 PM", start: "22:00", end: "23:00" },
    { label: "11 PM - 12 MN", start: "23:00", end: "24:00" },
  ];

  const formatBookingDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);

    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(year, month - 1, day));
  };

  const toggleCalendarCourt = (court: string) => {
    setSelectedCalendarCourts((currentCourts) => {
      if (currentCourts.includes(court)) {
        return currentCourts.filter((selectedCourt) => selectedCourt !== court);
      }
      return [...currentCourts, court];
    });
  };

  const loadCalendarAvailability = async (selectedDate: string) => {
    try {
      setIsLoadingCalendar(true);
      setCalendarError("");

      const response = await fetch(
        `/api/get-calendar?date=${encodeURIComponent(date)}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load calendar availability.",
        );
      }

      setCalendarBookings(data.bookings || []);
    } catch (error) {
      setCalendarError(
        error instanceof Error
          ? error.message
          : "Unable to load calendar availability.",
      );

      setCalendarBookings([]);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleOpenCalendar = () => {
    setShowCalendarModal(true);
    setShowCalendarFilters(false);
    loadCalendarAvailability(calendarDate);
    setCalendarStartFilter("00:00");
    setCalendarEndFilter("24:00");
    setSelectedCalendarCourts(calendarCourts);
  };

  const convertTimeToMinutes = (time: string) => {
    if (!time) return 0;

    if (time === "24:00") {
      return 24 * 60;
    }

    const normalizedTime = time.trim().toUpperCase();

    const twentyFourHourMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})$/);

    if (twentyFourHourMatch) {
      return (
        Number(twentyFourHourMatch[1]) * 60 + Number(twentyFourHourMatch[2])
      );
    }

    const twelveHourMatch = normalizedTime.match(
      /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/,
    );

    if (!twelveHourMatch) return 0;

    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2] || "0");
    const period = twelveHourMatch[3];

    if (period === "AM" && hours === 12) {
      hours = 0;
    }

    if (period === "PM" && hours !== 12) {
      hours += 12;
    }

    return hours * 60 + minutes;
  };

  const getCalendarSlotStatus = (
    court: string,
    slotStart: string,
    slotEnd: string,
  ): CalendarSlotStatus => {
    const slotStartMinutes = convertTimeToMinutes(slotStart);

    const slotEndMinutes =
      slotEnd === "24:00" ? 24 * 60 : convertTimeToMinutes(slotEnd);

    let result: CalendarSlotStatus = "available";

    for (const booking of calendarBookings) {
      const bookedCourts = booking.court
        .split(",")
        .map((bookedCourt: string) => bookedCourt.trim().toLowerCase());

      const courtIsBooked = bookedCourts.includes(court.trim().toLowerCase());

      if (!courtIsBooked) {
        continue;
      }

      const bookingStart = convertTimeToMinutes(booking.startTime);

      let bookingEnd = convertTimeToMinutes(booking.endTime);

      if (bookingEnd <= bookingStart) {
        bookingEnd += 24 * 60;
      }

      const overlaps =
        bookingStart < slotEndMinutes && bookingEnd > slotStartMinutes;

      if (!overlaps) {
        continue;
      }

      const status = booking.bookingStatus?.trim().toLowerCase();

      if (status === "confirmed") {
        return "occupied";
      }

      if (
        status === "pending payment" ||
        status === "pending paying" ||
        status === "payment verification" ||
        status === "payment verfication"
      ) {
        result = "reserved";
      }
    }

    return result;
  };

  const filteredCalendarTimeSlots = calendarTimeSlots.filter((slot) => {
    const slotStart = convertTimeToMinutes(slot.start);

    const filterStart = convertTimeToMinutes(calendarStartFilter);

    const filterEnd =
      calendarEndFilter === "24:00"
        ? 24 * 60
        : convertTimeToMinutes(calendarEndFilter);

    return slotStart >= filterStart && slotStart < filterEnd;
  });

  const filteredCalendarCourts = calendarCourts.filter((court) =>
    selectedCalendarCourts.includes(court),
  );

  const qrImages = {
    BPI: "/qr/bpiQR.png",
    GCash: "/qr/gcashQR.jpg",
    Maya: "/qr/mayaQR.jpg",
  };

  const toggleCourt = (courtName: string) => {
    setSelectedCourts((prev) => {
      const updated = prev.includes(courtName)
        ? prev.filter((c) => c !== courtName)
        : [...prev, courtName];

      return updated.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ""));
        const numB = parseInt(b.replace(/\D/g, ""));
        return numA - numB;
      });
    });
  };

  const times = [
    "12:00 AM",
    "1:00 AM",
    "2:00 AM",
    "3:00 AM",
    "4:00 AM",
    "5:00 AM",
    "6:00 AM",
    "7:00 AM",
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
    "9:00 PM",
    "10:00 PM",
    "11:00 PM",
  ];

  const timeToHour = (time: string) => {
    const [hourMinute, period] = time.split(" ");
    let hour = Number(hourMinute.split(":")[0]);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return hour;
  };

  const getBookingHours = (bookingStart: string, bookingEnd: string) => {
    if (!bookingStart || !bookingEnd) return 0;

    const startHour = timeToHour(bookingStart);
    const endHour = timeToHour(bookingEnd);

    return endHour > startHour ? endHour - startHour : 24 - startHour + endHour;
  };

  const bookingHours = getBookingHours(startTime, endTime);
  const totalAmount =
    bookingHours * selectedCourts.length * PRICE_PER_COURT_PER_HOUR;

  const availableCourts = COURTS.filter(
    (court) => !unavailableCourts.includes(court.name),
  );

const handleCheck = async () => {
  if (!date || !startTime || !endTime) {
    alert("Please select a date, start time, and end time.");
    return;
  }

  try {
    const response = await fetch(
      `/api/get-calendar?date=${encodeURIComponent(date)}`,
      {
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to check availability.",
      );
    }

    const selectedStart =
      convertTimeToMinutes(startTime);

    let selectedEnd =
      convertTimeToMinutes(endTime);

    // Handle bookings that end the next day.
    if (selectedEnd <= selectedStart) {
      selectedEnd += 24 * 60;
    }

    const unavailable = (
      data.bookings as CalendarBooking[]
    )
      .filter((booking) => {
        const bookingStart =
          convertTimeToMinutes(booking.startTime);

        let bookingEnd =
          convertTimeToMinutes(booking.endTime);

        // Handle existing overnight bookings.
        if (bookingEnd <= bookingStart) {
          bookingEnd += 24 * 60;
        }

        return (
          bookingStart < selectedEnd &&
          bookingEnd > selectedStart
        );
      })
      .flatMap((booking) =>
        booking.court
          .split(",")
          .map((court) => court.trim()),
      );

    setUnavailableCourts([
      ...new Set(unavailable),
    ]);

    setSelectedCourts([]);
    setShowCourts(true);
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Unable to check court availability.",
    );
  }

  if (window.innerWidth < 768) {
    setTimeout(() => {
      availableCourtsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }
};

  const handleSubmitBookingRequest = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (
        !date ||
        !startTime ||
        !endTime ||
        selectedCourts.length === 0 ||
        !customerName ||
        !customerContact ||
        !customerEmail
      ) {
        alert("Please complete all booking details.");
        return;
      }

      if (!/^09\d{9}$/.test(customerContact)) {
        alert("Please enter a valid Philippine mobile number (09xxxxxxxxx).");
        return;
      }

      if (!customerEmail.trim().toLowerCase().endsWith("@domain.com")) {
        alert("Please enter a valid email address.");
        return;
      }

      const isOvernight = timeToHour(endTime) <= timeToHour(startTime);

      const newBooking: Booking = {
        date: formatBookingDate(date),
        startTime,
        endTime,
        court: selectedCourts.join(", "),
        name: customerName,
        contact: customerContact,
        email: customerEmail,
        amount: totalAmount,
        isOvernight,
        bookingStatus: "Pending Payment",
      };

      const createdAt = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
        .format(new Date())
        .replace(" at ", " ");

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: bookingId,
          createdAt: createdAt,
          ...newBooking,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        if (response.status === 409) {
          alert(
            responseData.message ||
              "This schedule was just reserved by another customer."
          );

          setShowBookingModal(false);
          setSelectedCourts([]);
          setShowCourts(false);
          return;
        }

        alert(
          responseData.message ||
            "Failed to save booking."
        );
        return;
      }

      setShowBookingModal(false);
      setShowSuccessModal(true);

      setSelectedCourts([]);
      setCustomerName("");
      setCustomerContact("");
      setCustomerEmail("");
      setShowCourts(false);
      setShowBookingModal(false);
    } catch (error) {
      console.error(error);
      alert("Failed to submit booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [paymentSubmitError, setPaymentSubmitError] = useState("");

  const [paymentSubmitSuccess, setPaymentSubmitSuccess] = useState("");

  const handleSubmitPayment = async () => {
    if (!bookingNumber.trim()) {
      setPaymentSubmitError("Please enter your booking number.");
      return;
    }

    if (!paymentMethod) {
      setPaymentSubmitError("Please select a payment method.");
      return;
    }

    if (!paymentReceipt) {
      setPaymentSubmitError("Please attach your payment receipt.");
      return;
    }

    try {
      setIsSubmittingPayment(true);
      setPaymentSubmitError("");
      setPaymentSubmitSuccess("");

      const formData = new FormData();

      formData.append("bookingId", bookingNumber.trim());

      formData.append("paymentMethod", paymentMethod);

      formData.append("receipt", paymentReceipt);

      const response = await fetch("/api/submit-payment", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();

      let data: {
        success?: boolean;
        message?: string;
        receiptUrl?: string;
      };

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `The server returned an invalid response. Status: ${response.status}`,
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to submit payment.");
      }

      setPaymentSubmitSuccess("Payment receipt submitted successfully.");

      setPaymentReceipt(null);
      setPaymentMethod("");

      if (paymentReceiptInputRef.current) {
        paymentReceiptInputRef.current.value = "";
      }
    } catch (error) {
      setPaymentSubmitError(
        error instanceof Error ? error.message : "Unable to submit payment.",
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  function DetailRow({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex justify-between border-b border-slate-700 pb-3">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-white">{value}</span>
      </div>
    );
  }

  function generateBookingId() {
    const now = new Date();

    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const random =
      chars[Math.floor(Math.random() * chars.length)] +
      chars[Math.floor(Math.random() * chars.length)];

    return `${month}${day}${year}${hours}${minutes}${seconds}${random}`;
  }

  const handleViewBookingDetails = async () => {
    if (!bookingNumber.trim()) {
      setBookingLookupError("Please enter a booking number.");
      return;
    }

    try {
      setIsLoadingBooking(true);
      setBookingLookupError("");

      const response = await fetch(
        `/api/bookings?bookingId=${encodeURIComponent(bookingNumber.trim())}`,
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Booking not found.");
      }

      setSelectedBookingDetails(data.booking);
      setShowBookingDetails(true);
    } catch (error) {
      setBookingLookupError(
        error instanceof Error
          ? error.message
          : "Unable to retrieve booking details.",
      );
    } finally {
      setIsLoadingBooking(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">PickleCourt Booking</h1>
          <p className="text-slate-300 text-lg">
            Reserve your pickleball court online in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800">
            <h2 className="text-2xl font-semibold mb-6">Book a Court</h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm text-slate-400">
                  Select Date
                </label>

                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  disabled={selectedCourts.length > 0}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setShowCourts(false);
                    setSelectedCourts([]);
                  }}
                  className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm text-slate-300">
                    Start Time
                  </label>

                  <select
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setShowCourts(false);
                      setSelectedCourts([]);
                    }}
                    disabled={!date || selectedCourts.length > 0}
                    className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700"
                  >
                    <option value="">-----</option>
                    {times.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm text-slate-300">
                    End Time
                  </label>

                  <select
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setShowCourts(false);
                      setSelectedCourts([]);
                    }}
                    disabled={!startTime || selectedCourts.length > 0}
                    className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700"
                  >
                    <option value="">-----</option>
                    {times.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCheck}
                disabled={selectedCourts.length > 0}
                className="w-full bg-green-500 hover:bg-green-600 transition p-4 rounded-xl font-semibold disabled:opacity-50 mt-6"
              >
                Check Available Courts
              </button>

              <button
                type="button"
                onClick={handleOpenCalendar}
                className="w-full rounded-xl bg-orange-500 px-5 py-4 font-semibold text-white transition hover:bg-orange-600"
              >
                View Calendar
              </button>

              <div className="mt-5 space-y-3 border-t border-slate-700 pt-5 text-sm text-slate-300">
                <h3 className="font-semibold text-white">Court Details</h3>

                <div>
                  <span className="font-medium text-slate-400">Location:</span>{" "}
                  <a
                    href="https://maps.google.com/?q=YOUR+COURT+ADDRESS"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    Your court address — View on Google Maps
                  </a>
                </div>

                <div>
                  <span className="font-medium text-slate-400">
                    Contact Number: +639XXXXXXXXX
                  </span>
                </div>

                <div>
                  <span className="font-medium text-slate-400">
                    Contact Email: email@example.com
                  </span>
                </div>
              </div>
            </div>
          </div>

          {showCourts && (
            <div
              ref={availableCourtsRef}
              className="bg-slate-900 rounded-3xl p-8 border border-slate-800"
            >
              <h2 className="text-2xl font-semibold mb-6">Available Courts</h2>

              {!showCourts && (
                <p className="text-slate-400">
                  Select date and time first, then check available courts.
                </p>
              )}

              {showCourts && availableCourts.length === 0 && (
                <p className="text-red-400">
                  No courts available for this date and time.
                </p>
              )}

              {showCourts && (
                <div className="space-y-4">
                  {availableCourts.map((court) => (
                    <div
                      key={court.id}
                      className="bg-slate-800 p-5 rounded-2xl flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-semibold">{court.name}</h3>
                        <p className="text-sm text-slate-400">{court.type}</p>
                      </div>

                      <button
                        onClick={() => toggleCourt(court.name)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition
                    ${
                      selectedCourts.includes(court.name)
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                      >
                        {selectedCourts.includes(court.name) ? "REMOVE" : "ADD"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedCourts.length > 0 && (
                <div className="mt-6 space-y-4">
                  <p className="text-green-400 font-semibold">
                    Selected Court: {selectedCourts.join(", ")}
                  </p>

                  <button
                    onClick={() => {
                      setBookingId(generateBookingId());
                      setShowBookingModal(true);
                    }}
                    className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Book
                  </button>
                </div>
              )}
            </div>
          )}

          {!showCourts && (
            <section className="rounded-3xl border border-slate-700 bg-slate-900 p-7">
              <h2 className="text-2xl font-semibold mb-6">Submit Payment</h2>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Booking Number
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={bookingNumber}
                    onChange={(e) => {
                      setBookingNumber(e.target.value);
                      setBookingLookupError("");
                    }}
                    placeholder="Enter booking number"
                    className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 p-4"
                  />

                  <button
                    type="button"
                    onClick={handleViewBookingDetails}
                    disabled={!bookingNumber.trim() || isLoadingBooking}
                    className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    {isLoadingBooking ? "Checking..." : "View Details"}
                  </button>
                </div>

                {bookingLookupError && (
                  <p className="mt-2 text-sm text-red-400">
                    {bookingLookupError}
                  </p>
                )}
              </div>
              <div className="mt-4">
                <label className="block mb-2 text-sm text-slate-300">
                  Payment Method
                </label>

                <div className="flex gap-3">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 p-4 text-white"
                  >
                    <option value="">Select payment method</option>
                    <option value="BPI">BPI</option>
                    <option value="GCash">GCash</option>
                    <option value="Maya">Maya</option>
                  </select>

                  <button
                    type="button"
                    disabled={!paymentMethod}
                    onClick={() => {
                      setSelectedQr(
                        qrImages[paymentMethod as keyof typeof qrImages],
                      );
                      setShowQrModal(true);
                    }}
                    className="rounded-xl bg-emerald-600 px-5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-700"
                  >
                    View QR
                  </button>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm text-slate-200 mt-3 mb-3">
                  Payment Receipt
                </label>

                <label className="relative flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/60 px-4 py-5 text-center transition hover:border-emerald-500 hover:bg-slate-800 mb-3">
                  <input
                    ref={paymentReceiptInputRef}
                    id="paymentReceipt"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;

                      setPaymentReceipt(file);

                      if (file?.type.startsWith("image/")) {
                        setReceiptPreview(URL.createObjectURL(file));
                      } else {
                        setReceiptPreview("");
                      }
                    }}
                  />

                  <label
                    htmlFor="paymentReceipt"
                    className="relative flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl bg-slate-800/50 px-4 text-center transition hover:bg-slate-800"
                  >
                    <span className="font-medium">
                      {receiptPreview ? (
                        <div className="flex w-full flex-col items-center gap-3">
                          <img
                            src={receiptPreview}
                            alt="Receipt preview"
                            className="h-40 w-full rounded-lg object-cover"
                          />

                          <div className="text-center">
                            <p className="truncate text-sm font-medium text-white">
                              {paymentReceipt?.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Click to replace receipt
                            </p>
                          </div>
                        </div>
                      ) : paymentReceipt?.type === "application/pdf" ? (
                        <div className="text-center">
                          <div className="mb-2 text-3xl">📄</div>
                          <p className="max-w-64 truncate text-sm font-medium">
                            {paymentReceipt.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            PDF selected
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            Attach payment receipt
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            JPG, PNG or PDF — maximum 5 MB
                          </p>
                        </div>
                      )}
                    </span>
                  </label>
                </label>
              </div>

              <button
                type="button"
                onClick={handleSubmitPayment}
                disabled={
                  !bookingNumber.trim() ||
                  !paymentMethod ||
                  !paymentReceipt ||
                  isSubmittingPayment
                }
                className="mt-3 w-full rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
              >
                {isSubmittingPayment ? "Uploading..." : "Submit Payment"}
              </button>

              {paymentSubmitError && (
                <p className="mt-3 text-sm text-red-400">
                  {paymentSubmitError}
                </p>
              )}

              {paymentSubmitSuccess && (
                <p className="mt-3 text-sm text-green-400">
                  {paymentSubmitSuccess}
                </p>
              )}
            </section>
          )}
        </div>
      </section>

      {showBookingDetails && selectedBookingDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowBookingDetails(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Booking Details</h2>

              <button
                type="button"
                onClick={() => setShowBookingDetails(false)}
                className="text-2xl text-slate-400 hover:text-white"
                aria-label="Close booking details"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 rounded-xl bg-slate-800 p-5">
              <DetailRow
                label="Booking Number"
                value={selectedBookingDetails.bookingId}
              />

              <DetailRow
                label="Customer"
                value={selectedBookingDetails.name || "Not available"}
              />

              <DetailRow
                label="Date"
                value={
                  selectedBookingDetails.date
                    ? /^\d{4}-\d{2}-\d{2}$/.test(selectedBookingDetails.date)
                      ? new Date(
                          `${selectedBookingDetails.date}T00:00:00`,
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : new Date(
                          selectedBookingDetails.date,
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                    : "Not available"
                }
              />

              <DetailRow
                label="Time"
                value={
                  selectedBookingDetails.startTime &&
                  selectedBookingDetails.endTime
                    ? `${selectedBookingDetails.startTime} - ${selectedBookingDetails.endTime}`
                    : "Not available"
                }
              />

              <DetailRow
                label="Court"
                value={selectedBookingDetails.court || "Not available"}
              />

              <DetailRow
                label="Amount"
                value={
                  String(selectedBookingDetails.amount)
                }
              />

              <DetailRow
                label="Booking Status"
                value={
                  selectedBookingDetails.bookingStatus || "Pending Payment"
                }
              />
            </div>

            <button
              type="button"
              onClick={() => setShowBookingDetails(false)}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showBookingModal &&
        (() => {
          const isOvernight = timeToHour(endTime) <= timeToHour(startTime);

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setShowBookingModal(false)}
            >
              <div
                className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Complete Booking</h2>

                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="text-2xl text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-5 rounded-xl bg-slate-800 p-4">
                  <p>
                    <span className="font-semibold">Booking Date:</span>{" "}
                    {date
                      ? new Date(`${date}T00:00:00`).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )
                      : ""}
                  </p>

                  <p>
                    <span className="font-semibold">
                      Booking Number: {bookingId}{" "}
                    </span>{" "}
                    (save this if you wish to pay later)
                  </p>

                  <p>
                    <span className="font-semibold">Time:</span> {startTime} -{" "}
                    {endTime}
                    {isOvernight && (
                      <span className="ml-1 rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                        NEXT DAY
                      </span>
                    )}
                  </p>

                  <p>
                    <span className="font-semibold">
                      Selected Court{selectedCourts.length > 1 ? "s" : ""}:
                    </span>{" "}
                    {selectedCourts.join(", ")}
                  </p>

                  <p>
                    <span className="font-semibold">Total Amount:</span>{" "}
                    {new Intl.NumberFormat("en-PH", {
                      style: "currency",
                      currency: "PHP",
                      minimumFractionDigits: 0,
                    }).format(totalAmount)}
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 outline-none focus:border-blue-500"
                  />

                  <input
                    type="tel"
                    placeholder="Contact Number: 09xxxxxxxxx"
                    value={customerContact}
                    onChange={(e) => {
                      const numbersOnly = e.target.value.replace(/\D/g, "");
                      setCustomerContact(numbersOnly);
                    }}
                    maxLength={11}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 outline-none focus:border-blue-500"
                  />

                  <input
                    type="email"
                    placeholder="emailaddress@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 rounded-xl bg-slate-700 py-3 font-semibold hover:bg-slate-600"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitBookingRequest}
                    disabled={
                      !customerName.trim() ||
                      !customerContact.trim() ||
                      isSubmitting
                    }
                    className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit Booking
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
            <div className="mb-5 flex justify-start">
              <div className="text-center">
                <p className="text-[11px]">Booking ID: {bookingId}</p>
              </div>
            </div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <span className="text-3xl text-green-400">✓</span>
            </div>

            <h2 className="mb-3 text-2xl font-bold">Booking Submitted</h2>

            <p className="mb-5 text-slate-300">
              Your booking request was submitted successfully.
            </p>

            <div className="mb-6 rounded-xl bg-slate-800 p-4 text-left">
              <p>
                <span className="font-semibold">Status:</span>{" "}
                <span className="text-amber-400">Pending Payment</span>
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Please confirm your payment within 10 minutes to secure your
                slot. Use the "Submit Payment" form provided or send a
                screenshot of your receipt with Booking Number as subject at
                basubasee@gmail.com.
              </p>
              <p className="mt-5 text-sm text-slate-400 italic">
                Note: Bookings beyond 10pm will not be processed.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                setSelectedCourts([]);
                setCustomerName("");
                setCustomerContact("");
                setShowCourts(false);
                setDate("");
                setStartTime("");
                setEndTime("");
              }}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Done
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                setSelectedCourts([]);
                setCustomerName("");
                setCustomerContact("");
                setShowCourts(false);
                setDate("");
                setStartTime("");
                setEndTime("");
                setBookingNumber(bookingId);
              }}
              className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-700 mt-4 mb-2"
            >
              Proceed to Submit Payment
            </button>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{paymentMethod} QR Code</h2>

              <button
                onClick={() => setShowQrModal(false)}
                className="text-2xl text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <img
              src={selectedQr}
              alt="Payment QR"
              className="mx-auto w-72 rounded-lg"
            />

            <a
              href={selectedQr}
              download={`${paymentMethod}-QR.png`}
              className="mt-6 block w-full rounded-xl bg-emerald-600 py-3 text-center font-semibold text-white transition hover:bg-emerald-700"
            >
              Download QR
            </a>

            <button
              onClick={() => setShowQrModal(false)}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 p-5">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">
                  Court Availability
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Select a date to view available court schedules.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-xl text-slate-300 transition hover:bg-slate-700 hover:text-white"
                aria-label="Close calendar"
              >
                ×
              </button>
            </div>

            <div className="border-b border-slate-700 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-2 block text-sm text-slate-300">
                    Calendar Date
                  </label>

                  <input
                    type="date"
                    value={calendarDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(event) => {
                      const selectedDate = event.target.value;

                      setCalendarDate(selectedDate);

                      if (selectedDate) {
                        loadCalendarAvailability(selectedDate);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowCalendarFilters((current) => !current)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-blue-500 bg-slate-800 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
                >
                  <span>⌕</span>
                  Filters
                  <span
                    className={`transition-transform ${
                      showCalendarFilters ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
              </div>

              {showCalendarFilters && (
                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_2fr_auto] lg:items-end">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Start Time
                      </label>

                      <select
                        value={calendarStartFilter}
                        onChange={(event) => {
                          const newStartTime = event.target.value;

                          setCalendarStartFilter(newStartTime);

                          if (
                            convertTimeToMinutes(newStartTime) >=
                            convertTimeToMinutes(calendarEndFilter)
                          ) {
                            const nextHour =
                              convertTimeToMinutes(newStartTime) + 60;

                            setCalendarEndFilter(
                              nextHour >= 24 * 60
                                ? "24:00"
                                : `${String(Math.floor(nextHour / 60)).padStart(
                                    2,
                                    "0",
                                  )}:00`,
                            );
                          }
                        }}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-blue-500"
                      >
                        {calendarTimeSlots.map((slot) => (
                          <option key={slot.start} value={slot.start}>
                            {slot.label.split(" - ")[0]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        End Time
                      </label>

                      <select
                        value={calendarEndFilter}
                        onChange={(event) =>
                          setCalendarEndFilter(event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-blue-500"
                      >
                        {calendarTimeSlots
                          .filter(
                            (slot) =>
                              convertTimeToMinutes(slot.end) >
                              convertTimeToMinutes(calendarStartFilter),
                          )
                          .map((slot) => (
                            <option key={slot.end} value={slot.end}>
                              {slot.label.split(" - ")[1]}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Court Number
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const allSelected =
                              selectedCalendarCourts.length ===
                              calendarCourts.length;

                            if (allSelected) {
                              // Deselect all
                              setSelectedCalendarCourts([]);
                            } else {
                              // Select all
                              setSelectedCalendarCourts([...calendarCourts]);
                            }
                          }}
                          className={`rounded-xl border px-4 py-1 font-semibold transition ${
                            selectedCalendarCourts.length ===
                            calendarCourts.length
                              ? "border-blue-500 bg-blue-600 text-white"
                              : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          {selectedCalendarCourts.length ===
                          calendarCourts.length
                            ? "All Courts"
                            : "All Courts"}
                        </button>

                        {calendarCourts.map((court) => {
                          const isSelected =
                            selectedCalendarCourts.includes(court);

                          return (
                            <button
                              key={court}
                              type="button"
                              onClick={() => toggleCalendarCourt(court)}
                              aria-pressed={isSelected}
                              className={`rounded-xl border px-4 py-3 font-semibold transition ${
                                isSelected
                                  ? "border-blue-500 bg-blue-600 text-white"
                                  : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                              }`}
                            >
                              {isSelected ? ` ${court}` : court}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCalendarStartFilter("00:00");
                        setCalendarEndFilter("24:00");
                        setSelectedCalendarCourts(calendarCourts);
                      }}
                      className="rounded-xl bg-slate-700 px-5 py-3 font-semibold text-white transition hover:bg-slate-600"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-4 text-sm mt-5">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  Available
                </span>

                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-yellow-500" />
                  Reserved
                </span>

                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  Occupied
                </span>
              </div>
            </div>

            {/* Calendar body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {calendarError && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                  {calendarError}
                </div>
              )}

              {isLoadingCalendar ? (
                <div className="flex min-h-64 items-center justify-center text-slate-400">
                  Loading availability...
                </div>
              ) : (
                <div className="w-full rounded-xl border border-slate-700">
                  {selectedCalendarCourts.length === 0 && (
                    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                      Select at least one court to display availability.
                    </div>
                  )}

                  {selectedCalendarCourts.length > 0 && (
                    <div className="max-h-[55vh] w-full overflow-auto overscroll-contain">
                      <table className="w-max min-w-full border-collapse text-sm [zoom:0.7] sm:[zoom:1]">
                        <thead>
                          <tr className="bg-slate-800">
                            <th className="sticky left-0 top-0 z-30 min-w-40 border-b border-r border-slate-700 bg-slate-800 p-3 text-left">
                              Time
                            </th>

                            {filteredCalendarCourts.map((court) => (
                              <th
                                key={court}
                                className="sticky top-0 z-20 min-w-[160px] whitespace-nowrap border-b border-r border-slate-700 bg-slate-800 p-3 text-center last:border-r-0"
                              >
                                {court}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {filteredCalendarTimeSlots.map((slot) => (
                            <tr key={slot.start}>
                              <td className="min-w-[160px] px-4 py-3 sticky left-0 z-10 border-b border-r border-slate-700 bg-slate-900 p-3 font-medium text-slate-300">
                                {slot.label}
                              </td>

                              {filteredCalendarCourts.map((court) => {
                                const slotStatus = getCalendarSlotStatus(
                                  court,
                                  slot.start,
                                  slot.end,
                                );

                                const unavailable = slotStatus !== "available";

                                return (
                                  <td
                                    key={`${court}-${slot.start}`}
                                    className="border-b border-r border-slate-700 p-2 text-center last:border-r-0"
                                  >
                                    <button
                                      type="button"
                                      disabled={unavailable}
                                      onClick={() => {
                                        setDate(calendarDate);
                                        setStartTime(slot.start);
                                        setEndTime(
                                          slot.end === "24:00"
                                            ? "00:00"
                                            : slot.end,
                                        );
                                        setShowCalendarModal(false);
                                        setShowCourts(false);
                                        setSelectedCourts([]);
                                      }}
                                      className={`w-full rounded-lg px-3 py-2 font-semibold transition ${
                                        slotStatus === "occupied"
                                          ? "cursor-not-allowed bg-red-500/15 text-red-400"
                                          : slotStatus === "reserved"
                                            ? "cursor-not-allowed bg-yellow-500/15 text-yellow-400"
                                            : "bg-green-500/15 text-green-400 hover:bg-green-500 hover:text-white"
                                      }`}
                                    >
                                      {slotStatus === "occupied"
                                        ? "Occupied"
                                        : slotStatus === "reserved"
                                          ? "Reserved"
                                          : "Available"}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              <div className="border-t border-slate-700 p-4 text-right">
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="rounded-xl bg-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
