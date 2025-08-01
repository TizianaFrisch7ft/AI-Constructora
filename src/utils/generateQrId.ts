import QuoteRequest from "../models/QuoteRequest";

let currentNumber = 100;

export const generateQrId = async (): Promise<string> => {
  while (true) {
    currentNumber++;
    const qr_id = `QR${currentNumber}`;
    const exists = await QuoteRequest.findOne({ qr_id });
    if (!exists) return qr_id;
  }
};
