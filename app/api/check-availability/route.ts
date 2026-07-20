import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({
  version: "v4",
  auth,
});

function normalizeDate(value: string) {
  const trimmed = value.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Google Sheets may return M/D/YYYY
  const slashDate = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashDate) {
    const [, month, day, year] = slashDate;

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Handles dates such as July 18, 2026
  const parsedDate = new Date(trimmed);

  if (!Number.isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return trimmed;
}

function timeToMinutes(time: string) {
  const trimmed = time.trim();

  // Handles 24-hour time such as 14:30
  const twentyFourHour = trimmed.match(/^(\d{1,2}):(\d{2})$/);

  if (twentyFourHour) {
    return Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2]);
  }

  // Handles time such as 2:30 PM
  const twelveHour = trimmed.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  );

  if (!twelveHour) {
    return 0;
  }

  let hour = Number(twelveHour[1]);
  const minute = Number(twelveHour[2]);
  const period = twelveHour[3].toUpperCase();

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  return hour * 60 + minute;
}

function dateToDayNumber(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function createTimeRange(
  date: string,
  startTime: string,
  endTime: string
) {
  const day = dateToDayNumber(date);
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);

  // End time is on the next day
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return {
    start: day * 1440 + startMinutes,
    end: day * 1440 + endMinutes,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const date = searchParams.get("date");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          message: "Date, start time, and end time are required.",
        },
        { status: 400 }
      );
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Bookings!A3:J",
    });

    const rows = response.data.values ?? [];
    const requestedRange = createTimeRange(date, startTime, endTime);

    const unavailableCourts = new Set<string>();

    for (const row of rows) {
      const bookingDate = row[2]?.toString() ?? "";
      const bookingStartTime = row[3]?.toString() ?? "";
      const bookingEndTime = row[4]?.toString() ?? "";
      const bookedCourt = row[5]?.toString() ?? "";
      const bookingStatus = row[9]?.toString() ?? "";

      // Only confirmed bookings block a court
      if (bookingStatus.trim().toLowerCase() !== "confirmed") {
        continue;
      }

      if (
        !bookingDate ||
        !bookingStartTime ||
        !bookingEndTime ||
        !bookedCourt
      ) {
        continue;
      }

      const confirmedRange = createTimeRange(
        normalizeDate(bookingDate),
        bookingStartTime,
        bookingEndTime
      );

      const overlaps =
        requestedRange.start < confirmedRange.end &&
        requestedRange.end > confirmedRange.start;

      if (overlaps) {
        // Supports cells like "Court 1, Court 2"
        bookedCourt.split(",").forEach((court: string) => {
          unavailableCourts.add(court.trim());
        });
      }
    }

    return NextResponse.json({
      success: true,
      unavailableCourts: Array.from(unavailableCourts),
    });
  } catch (error) {
    console.error("Availability error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to check court availability.",
      },
      { status: 500 }
    );
  }
}