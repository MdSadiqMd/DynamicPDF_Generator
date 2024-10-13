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

        const currentDate = new Date();
        const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}.${(currentDate.getMonth() + 1).toString().padStart(2, '0')}.${currentDate.getFullYear()}`;

        const joiningDate = new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000);
        const formattedJoiningDate = `${joiningDate.getDate().toString().padStart(2, '0')}th ${joiningDate.toLocaleString('default', { month: 'long' })} ${joiningDate.getFullYear()}`;

        const toLineX = 65;
        const toLineY = 625;
        const dearLineX = 87;
        const dearLineY = 580;
        const dateLineX = 485;
        const dateLineY = 691;
        const joiningDateLineX = 453;
        const joiningDateLineY = 442;

        // To text
        firstPage.drawText(`${name},`, {
            x: toLineX,
            y: toLineY,
            size: 12,
            font: timesRomanBoldFont,
            color: rgb(0, 0, 0),
        });

        // Dear text
        firstPage.drawText(`${name},`, {
            x: dearLineX,
            y: dearLineY,
            size: 10,
            font: timesRomanBoldFont,
            color: rgb(0, 0, 0),
        });

        // Date text
        firstPage.drawText(formattedDate, {
            x: dateLineX,
            y: dateLineY,
            size: 10,
            font: timesRomanBoldFont,
            color: rgb(0, 0, 0),
        });
        
        // Joining date text
        firstPage.drawText(formattedJoiningDate, {
            x: joiningDateLineX,
            y: joiningDateLineY,
            size: 10,
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