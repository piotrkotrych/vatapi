const https = require("https");
const fs = require("fs");
const date = require("date-and-time");
const Seven = require("node-7z");
const mysql = require("mysql");

console.log("Flat file downloader started");

//file name
console.log("Preparing url");
const basic_filename = date.format(new Date(), "YYYYMMDD");
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
  console.log(`File ${filename} downloaded`);

  const unzip = Seven.extractFull(download_path, "./download", {
    $bin: "C:\\Program Files\\7-Zip\\7z.exe",
    $progress: true,
    $overwrite: "a",
  });

  unzip.on("end", function () {
    console.log("File extracted");

    //delete downloaded file

    fs.unlink(download_path, (err) => {
      if (err) {
        throw err;
      } else {
        console.log(`File ${filename} deleted`);

        //load extracted json file into memory
        const json = require("./download/" + basic_filename + ".json");

        console.log("File loaded into memory");

        //length of json['skrotyPodatnikowCzynnych']
        const length = json["skrotyPodatnikowCzynnych"].length;

        //each value in json['skrotyPodatnikowCzynnych'] map to array
        const czynni = json["skrotyPodatnikowCzynnych"].map((value) => {
          return [value];
        });

        // split json['skrotyPodatnikowCzynnych'] into chunks of 100
        const chunks = [];
        const chunkSize = 100;
        for (let i = 0; i < czynni.length; i += chunkSize) {
          chunks.push(czynni.slice(i, i + chunkSize));
        }

        console.log("File splitted into chunks");

        console.log(chunks[0]);

        //connect to database
        const connection = mysql.createConnection({
          host: "localhost",
          user: "root",
          password: "",
          database: "vatapi",
        });

        connection.connect(function (err) {
          if (err) {
            console.error("Error connecting: " + err.stack);
            return;
          }

          console.log("Connected as id " + connection.threadId);
        });

        let type = "czynni";

        //each chunk[0] value is an array of 100 values
        chunks.forEach((chunk) => {
          console.log("Inserting chunk");
          console.log(chunk);
        });

        //close connection
        connection.end(function (err) {
          if (err) {
            return console.log("error:" + err.message);
          }
          console.log("Close the database connection.");
        });
      }
    });
  });
});

//download error
request.on("error", function (err) {
  fs.unlink(download_path);
  console.log(`Error downloading the file: ${err.message}`);
});
