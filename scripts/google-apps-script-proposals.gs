const SHEET_NAME = 'Respuestas';
const HEADERS = [
  'Recibido',
  'Tipo de envío',
  'Correo',
  'Ciudad',
  'Tipo de lugar',
  'Detalles',
  'Fecha del cliente',
];

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || '{}');
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('PROPOSALS_SECRET');

    if (!expectedSecret || payload.secret !== expectedSecret) {
      return jsonResponse({ success: false, error: 'No autorizado' });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      payload.submissionType,
      payload.email,
      payload.city,
      payload.proposalType,
      payload.details,
      payload.timestamp,
    ].map(function (value, index) { return index === 0 ? value : sheetSafe(value); }));

    return jsonResponse({ success: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ success: false, error: 'No se pudo guardar' });
  }
}

// Sheets ejecuta como fórmula lo que empieza con = + - @ (o tab / retorno).
// Con un apóstrofo inicial queda como texto. Así un "=IMPORTXML(...)" en la
// ciudad no puede leer ni mandar fuera las demás filas.
function sheetSafe(value) {
  const text = String(value == null ? '' : value);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
