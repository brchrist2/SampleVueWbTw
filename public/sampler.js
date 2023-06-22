let pdfjsLib = require('pdfjs-dist');
let url = './public/36798.pdf';

let cityStateZipPattern = /^[a-zA-Z\s]+, [A-Z]{2} \d{5}$/;  // Matches "City, ST 12345"
let entries = [];

function processPage(pdf, pageNum) {
    if (pageNum > pdf.numPages) {
        console.log(entries);  // Log all entries after processing all pages
        return;
    }

    pdf.getPage(pageNum).then(function(page) {
        return page.getTextContent();
    }).then(function(textContent) {
        let textItems = textContent.items;
        let currentEntry = [];
        let lastX = 0;
        for (let item of textItems) {
            let str = item.str;
            let x = item.transform[4];
            if (str.trim() === '' || Math.abs(x - lastX) > 100) {  // If line is blank or there is a large horizontal movement, complete the current entry and start a new one
                if (currentEntry.length > 0) {
                    entries.push(currentEntry);
                    currentEntry = [];
                }
            }
            if (str.trim() !== '') {  // If line is not blank, add it to the current entry
                currentEntry.push(str);
                if (cityStateZipPattern.test(str)) {  // If line matches city, state, zip pattern, complete the current entry and start a new one
                    entries.push(currentEntry);
                    currentEntry = [];
                }
                lastX = x;
            }
        }
        if (currentEntry.length > 0) {
            entries.push(currentEntry);
        }

        processPage(pdf, pageNum + 1);  // Process the next page
    }).catch(function(error) {
        console.error('Error:', error);
    });
}

pdfjsLib.getDocument(url).promise.then(function(pdf) {
    processPage(pdf, 1);  // Start processing from page 1
}).catch(function(error) {
    console.error('Error:', error);
});
