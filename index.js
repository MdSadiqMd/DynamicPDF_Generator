const express = require('express');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function getNextReferenceNumber() {
    const refFilePath = path.join(__dirname, 'lastReferenceNumber.txt');
    let lastNumber = 0;
    if (fs.existsSync(refFilePath)) {
        lastNumber = parseInt(fs.readFileSync(refFilePath, 'utf8'));
    }
    const nextNumber = lastNumber + 1;
    fs.writeFileSync(refFilePath, nextNumber.toString());
    return nextNumber.toString().padStart(6, '0');
}

app.get('/', (req, res) => {
    res.send(`
    <form action="/generate-pdf" method="POST">
      <label for="name">Enter Your Name:</label>
      <input type="text" id="name" name="name" required>
      <button type="submit">Generate Offer Letter</button>
    </form>
  `);
});

app.post('/generate-pdf', async (req, res) => {
    const { name } = req.body;

    try {
        const pdfPath = path.join(__dirname, 'OL_Format.pdf');
        const existingPdfBytes = fs.readFileSync(pdfPath);

        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

        const drawText = (text, x, y, size) => {
            return firstPage.drawText(text, {
                x,
                y,
                size,
                font: timesRomanBoldFont,
                color: rgb(0, 0, 0),
            });
        };

        const currentDate = new Date();
        const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}.${(currentDate.getMonth() + 1).toString().padStart(2, '0')}.${currentDate.getFullYear()}`;

        const joiningDate = new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000);
        const formattedJoiningDate = `${joiningDate.getDate().toString().padStart(2, '0')}th ${joiningDate.toLocaleString('default', { month: 'long' })} ${joiningDate.getFullYear()}`;

        const refNumber = getNextReferenceNumber();
        const fullRefNumber = `SCALEJOBS/ASSOCIATE/${refNumber}`;

        const coordinates = {
            refNumber: { x: 112, y: 691 },
            toLine: { x: 65, y: 625 },
            dearLine: { x: 87, y: 580 },
            dateLine: { x: 485, y: 691 },
            joiningDateLine: { x: 453, y: 442 },
        };

        drawText(fullRefNumber, coordinates.refNumber.x, coordinates.refNumber.y, 10);
        drawText(`${name},`, coordinates.toLine.x, coordinates.toLine.y, 12);
        drawText(`${name},`, coordinates.dearLine.x, coordinates.dearLine.y, 10);
        drawText(formattedDate, coordinates.dateLine.x, coordinates.dateLine.y, 10);
        drawText(formattedJoiningDate, coordinates.joiningDateLine.x, coordinates.joiningDateLine.y, 10);

        const pdfBytes = await pdfDoc.save();
        // These headers will signal browser to download the file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="OfferLetter_${name}.pdf"`);
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});