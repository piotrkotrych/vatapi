const https = require("https");
const fs = require("fs");
const date = require("date-and-time");

console.log("Flat file downloader started");

//file name
console.log("Preparing url");
const filename = date.format(new Date(), "YYYYMMDD") + ".7z";

const url = "https://plikplaski.mf.gov.pl/pliki//" + filename;

//download path
const download_path = "./download/" + filename;

//download file
const file = fs.createWriteStream(download_path);
const request = https.get(url, function (response) {
  console.log(`Downloading file ${filename}`);
  response.pipe(file);
});

//download finished
file.on("finish", function () {
  file.close();
  console.log(`File ${filename} downloaded`);
});

//download error
request.on("error", function (err) {
  fs.unlink(download_path);
  console.log(`Error downloading the file: ${err.message}`);
});
