
const { generateContractPdf } = require('./src/lib/pdf/contract-generator');
const fs = require('fs');

async function test() {
  const data = {
    packageId: 'manual-arma',
    packageName: 'Paquete Personalizado',
    packagePrice: 10000,
    guestCount: 100,
    venueType: 'salon',
    street: 'Calle Test',
    houseNumber: '123',
    colonia: 'Colonia Test',
    municipio: 'Municipio Test',
    city: 'City Test',
    state: 'State Test',
    requestedDate: new Date().toISOString(),
    startTime: '21:00',
    endTime: '23:00',
    clientName: 'Fer Montes de Oca',
    depositAmount: 5000,
    viaticosAmount: 0
  };

  try {
    const pdfBytes = await generateContractPdf(data, 'TEST-123', { includeLegal: true });
    fs.writeFileSync('test_contract.pdf', pdfBytes);
    console.log('Success!');
  } catch (err) {
    console.error('FAILED:', err);
  }
}

test();
