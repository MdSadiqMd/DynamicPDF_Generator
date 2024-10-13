const express = require('express');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

        // Define the coordinates to place the user's name
        const toLineX = 65; // X-coordinate for below "To"
        const toLineY = 625; // Y-coordinate for below "To"
        const dearLineX = 87; // X-coordinate for after "Dear"
        const dearLineY = 580; // Y-coordinate for "Dear"

        // Add the user's name below the "To" line in bold
        firstPage.drawText(`${name},`, {
            x: toLineX,
            y: toLineY,
            size: 12,
            font: timesRomanBoldFont,
            color: rgb(0, 0, 0),
        });

        // Add the user's name after the "Dear" word in bold
        firstPage.drawText(`${name},`, {
            x: dearLineX,
            y: dearLineY,
            size: 12,
            font: timesRomanBoldFont,
            color: rgb(0, 0, 0),
        });

        const pdfBytes = await pdfDoc.save();
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
