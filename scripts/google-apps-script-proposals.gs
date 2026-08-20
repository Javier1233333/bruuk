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
      payload.submissionType || '',
      payload.email || '',
      payload.city || '',
      payload.proposalType || '',
      payload.details || '',
      payload.timestamp || '',
    ]);

    return jsonResponse({ success: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ success: false, error: 'No se pudo guardar' });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
