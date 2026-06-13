import QRCode from 'qrcode';

/**
 * Generate a QR code SVG string
 * @param {string} data - data to encode
 * @returns {Promise<string>} SVG markup string
 */
export const generateQRCodeSVG = async (data) => {
  return QRCode.toString(data, {
    type: 'svg',
    color: {
      dark: '#02462E',
      light: '#FFFFFF',
    },
    width: 300,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
};

/**
 * Generate a QR code as a base64 PNG data URL
 * @param {string} data
 * @returns {Promise<string>} data URL
 */
export const generateQRCodePNG = async (data) => {
  return QRCode.toDataURL(data, {
    color: {
      dark: '#02462E',
      light: '#FBF6E6',
    },
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
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
