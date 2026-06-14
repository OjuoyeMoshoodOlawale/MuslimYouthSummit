/**
 * QR code service — uses qrcode-svg (pure JS, no native build dependencies)
 * for reliable SVG generation, with the `qrcode` package as an optional
 * enhancement for PNG data-URLs (used in emails).
 */
import QRCodeSVG from 'qrcode-svg';

/**
 * Generate a QR code SVG string (pure JS — always works, no native deps).
 * @param {string} data - data to encode
 * @returns {Promise<string>} SVG markup string
 */
export const generateQRCodeSVG = async (data) => {
  const qr = new QRCodeSVG({
    content: data,
    width: 300,
    height: 300,
    color: '#02462E',
    background: '#FFFFFF',
    padding: 1,
    ecl: 'M',
    join: true,           // join adjacent modules — cleaner, smaller SVG
  });
  return qr.svg();
};

/**
 * Generate a QR code as a base64 PNG data URL (for emails).
 * Falls back to an SVG data-URI if the `qrcode` PNG package isn't available.
 * @param {string} data
 * @returns {Promise<string>} data URL
 */
export const generateQRCodePNG = async (data) => {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(data, {
      color: { dark: '#02462E', light: '#FFFFFF' },
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
  } catch {
    // qrcode (native) unavailable → return an SVG data-URI instead
    const svg = await generateQRCodeSVG(data);
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
};

/**
 * Generate ticket QR data
 * Links to: /ticket/:uniqueNumber
 */
export const ticketQRData = (uniqueNumber, baseUrl) => {
  return `${baseUrl || process.env.FRONTEND_URL}/ticket/${uniqueNumber}`;
};

/**
 * Generate tag QR data
 * Links to: check-in endpoint with tag number
 */
export const tagQRData = (tagNumber, eventId, baseUrl) => {
  return `${baseUrl || process.env.FRONTEND_URL}/check-in?tag=${tagNumber}&event=${eventId}`;
};
