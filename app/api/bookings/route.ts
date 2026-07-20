import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const appsScriptUrl =
      process.env.GOOGLE_APPS_SCRIPT_BOOKING_URL;

    const bookingSecret =
      process.env.BOOKING_API_SECRET;

    if (!appsScriptUrl || !bookingSecret) {
      throw new Error(
        "Booking API environment variables are missing."
      );
    }

    const bookingResponse = await fetch(appsScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        secret: bookingSecret,
        bookingId: body.bookingId,
        createdAt: body.createdAt,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        court: body.court,
        name: body.name,
        contact: body.contact,
        email: body.email,
        amount: body.amount,
        bookingStatus: body.bookingStatus,
      }),
      cache: "no-store",
      redirect: "follow",
    });

    const responseText = await bookingResponse.text();

    let bookingResult;

    try {
      bookingResult = JSON.parse(responseText);
    } catch {
      console.error(
        "Invalid Apps Script response:",
        responseText
      );

      throw new Error(
        "The booking service returned an invalid response."
      );
    }

    if (!bookingResult.success) {
      if (bookingResult.conflict) {
        return NextResponse.json(
          {
            success: false,
            conflict: true,
            conflictingCourts:
              bookingResult.conflictingCourts || [],
            message:
              bookingResult.message ||
              "The selected schedule was just reserved.",
          },
          { status: 409 }
        );
      }

      if (bookingResult.busy) {
        return NextResponse.json(
          {
            success: false,
            message: bookingResult.message,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            bookingResult.message ||
            "Failed to save booking.",
        },
        { status: 400 }
      );
    }

    /*
     * The booking has already been saved.
     * Email failure should not cancel the booking.
     */
    try {
      const webhookUrl =
        process.env.N8N_BOOKING_WEBHOOK_URL;

      if (webhookUrl) {
        const emailResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret":
              process.env.N8N_WEBHOOK_SECRET || "",
          },
          body: JSON.stringify({
            bookingId: body.bookingId,
            name: body.name,
            email: body.email,
            date: body.date,
            startTime: body.startTime,
            endTime: body.endTime,
            court: body.court,
            amount: body.amount,
            bookingStatus: body.bookingStatus,
          }),
        });

        if (!emailResponse.ok) {
          console.error(
            "n8n confirmation email failed:",
            await emailResponse.text()
          );
        }
      }
    } catch (emailError) {
      console.error(
        "Unable to trigger confirmation email:",
        emailError
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking submitted successfully.",
      bookingId: body.bookingId,
    });
  } catch (error) {
    console.error("Submit booking error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to save booking.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId")?.trim();

    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking number is required.",
        },
        { status: 400 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Bookings!A:K",
    });

    const rows = response.data.values || [];

    const bookingRow = rows.slice(1).find((row) => {
      const sheetBookingId = String(row[0] || "")
        .trim()
        .toLowerCase();

      return sheetBookingId === bookingId.toLowerCase();
    });

    if (!bookingRow) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        bookingId: bookingRow[0] || "",
        createdAt: bookingRow[1] || "",
        date: bookingRow[2] || "",
        startTime: bookingRow[3] || "",
        endTime: bookingRow[4] || "",
        court: bookingRow[5] || "",
        name: bookingRow[6] || "",
        contact: bookingRow[7] || "",
        email: bookingRow[8] || "",
        amount: bookingRow[9] || "",
        bookingStatus: bookingRow[10] || "",
        
      },
    });
  } catch (error) {
    console.error("Get booking error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve booking details.",
      },
      { status: 500 }
    );
  }
}