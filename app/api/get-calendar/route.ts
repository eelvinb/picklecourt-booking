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

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const slashDate = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (slashDate) {
    const [, month, day, year] = slashDate;

    return `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}`;
  }

  const parsedDate = new Date(trimmed);

  if (!Number.isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(
      2,
      "0"
    );
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return trimmed;
}

export async function GET(request: NextRequest) {
  try {
    const selectedDate =
      request.nextUrl.searchParams.get("date");

    if (!selectedDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Date is required.",
        },
        { status: 400 }
      );
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Bookings!A3:J",
    });

    const rows = response.data.values ?? [];

    const bookings = rows
      .filter((row) => {
        const bookingDate = row[2]?.toString() ?? "";
        const bookingStatus = row[9]?.toString() ?? "";

        const sameDate =
          normalizeDate(bookingDate) ===
          normalizeDate(selectedDate);

    const normalizedStatus = bookingStatus
      .trim()
      .toLowerCase();

    const visibleStatuses = [
      "confirmed",
      "pending payment",
      "payment verification",
    ];

    return (
      sameDate &&
      visibleStatuses.includes(normalizedStatus)
    );
      })
      .map((row) => ({
        date: normalizeDate(row[2]?.toString() ?? ""),
        startTime: row[3]?.toString() ?? "",
        endTime: row[4]?.toString() ?? "",
        court: row[5]?.toString() ?? "",
        bookingStatus: row[9]?.toString() ?? "",
      }));

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Calendar availability error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load calendar availability.",
      },
      { status: 500 }
    );
  }
}