import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Bookings!A3:J",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            body.bookingId,
            body.createdAt,
            body.date,
            body.startTime,
            body.endTime,
            body.court,
            body.name,
            body.contact,
            body.email,
            body.amount,
            body.bookingStatus,
          ],
        ],
      },
    });

    const updatedRange = appendResponse.data.updates?.updatedRange;
    const rowMatch = updatedRange?.match(/![A-Z]+(\d+):/i);
    const newRowNumber = rowMatch ? Number(rowMatch[1]) : null;

    if (!newRowNumber) {
      throw new Error("Could not determine the newly added row.");
    }

    const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    fields: "sheets.properties",
    });

    const bookingsSheet = spreadsheet.data.sheets?.find(
      (sheet) => sheet.properties?.title === "Bookings"
    ); 

    const bookingsSheetId = bookingsSheet?.properties?.sheetId;

    if (bookingsSheetId === undefined || bookingsSheetId === null) {
      throw new Error('Sheet named "Bookings" was not found.');
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [
          {
            copyPaste: {
              source: {
                sheetId: bookingsSheetId,
                startRowIndex: 1, // Row 2
                endRowIndex: 2,
                startColumnIndex: 9, // Column J
                endColumnIndex: 10,
              },
              destination: {
                sheetId: bookingsSheetId,
                startRowIndex: newRowNumber - 1,
                endRowIndex: newRowNumber,
                startColumnIndex: 9, // Column J
                endColumnIndex: 10,
              },
              pasteType: "PASTE_DATA_VALIDATION",
              pasteOrientation: "NORMAL",
            },
          },
        ],
      },
    });

    try {
      const emailResponse = await fetch(
        process.env.N8N_BOOKING_WEBHOOK_URL!,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET!,
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
        }
      );

      if (!emailResponse.ok) {
        console.error(
          "n8n confirmation email failed:",
          await emailResponse.text()
        );
      }
    } catch (emailError) {
      console.error("Unable to trigger confirmation email:", emailError);
    }

    // Keep the success response after the n8n request
    return NextResponse.json({
      success: true,
      message: "Booking submitted successfully.",
      bookingId: body.bookingId,
    });
    
  } catch (error) {
    console.error("Google Sheets Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save booking" },
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