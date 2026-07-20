import { google } from "googleapis";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadToCloudinary(
  fileBuffer: Buffer,
  bookingId: string,
  fileType: string
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "picklecourt/receipts",
        public_id: `${bookingId}-${Date.now()}`,
        resource_type: fileType === "application/pdf" ? "image" : "image",
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary did not return an upload result."));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const bookingId = String(formData.get("bookingId") || "").trim();
    const paymentMethod = String(
      formData.get("paymentMethod") || ""
    ).trim();

    const receipt = formData.get("receipt");

    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking number is required.",
        },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment method is required.",
        },
        { status: 400 }
      );
    }

    if (!(receipt instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment receipt is required.",
        },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(receipt.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG, and PDF files are allowed.",
        },
        { status: 400 }
      );
    }

    const maximumFileSize = 5 * 1024 * 1024;

    if (receipt.size > maximumFileSize) {
      return NextResponse.json(
        {
          success: false,
          message: "Receipt must not exceed 5 MB.",
        },
        { status: 400 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n"
        ),
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    });

    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    /*
      Read the booking rows first so an invalid booking number
      does not upload a receipt to Cloudinary.
    */
    const sheetResponse =
      await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Bookings!A:Z",
      });

    const rows = sheetResponse.data.values || [];

    const matchingRowIndex = rows.findIndex(
      (row, index) =>
        index > 0 &&
        String(row[0] || "").trim().toLowerCase() ===
          bookingId.toLowerCase()
    );

    if (matchingRowIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking number was not found.",
        },
        { status: 404 }
      );
    }

    const matchingRow = rows[matchingRowIndex];

    const customerName = String(matchingRow[6] || "").trim(); // Column G
    const customerEmail = String(matchingRow[8] || "").trim(); // Column I
    const bookingDate = String(matchingRow[2] || "").trim(); // Column C
    const startTime = String(matchingRow[3] || "").trim(); // Column D
    const endTime = String(matchingRow[4] || "").trim(); // Column E
    const court = String(matchingRow[5] || "").trim(); // Column F
    const amount = String(matchingRow[9] || "").trim(); // Column F

    const safeBookingId = bookingId.replace(
      /[^a-zA-Z0-9-_]/g,
      "_"
    );

    const fileBuffer = Buffer.from(
      await receipt.arrayBuffer()
    );

    const uploadedFile = await uploadToCloudinary(
      fileBuffer,
      safeBookingId,
      receipt.type
    );

    const receiptUrl = uploadedFile.secure_url;

    const sheetRowNumber = matchingRowIndex + 1;

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Bookings!K${sheetRowNumber}:N${sheetRowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            "Payment Verification",
            paymentMethod,
            receiptUrl,
            new Date().toISOString(),
          ],
        ],
      },
    });

    try {
      const emailResponse = await fetch(
        process.env.N8N_PAYMENT_RECEIVED_URL!,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET!,
          },
          body: JSON.stringify({
            bookingId,
            name: customerName,
            email: customerEmail,
            date: bookingDate,
            amount,
            startTime,
            endTime,
            court,
            paymentMethod,
            receiptUrl,
            paymentStatus: "Payment Verification",
          }),
        }
      );

      if (!emailResponse.ok) {
        console.error(
          "n8n payment email failed:",
          await emailResponse.text()
        );
      }
    } catch (emailError) {
      console.error(
        "Unable to trigger payment email:",
        emailError
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment receipt submitted successfully.",
      receiptUrl,
    });
  } catch (error) {
    console.error("Submit payment error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to submit payment receipt.",
      },
      { status: 500 }
    );
  }
}