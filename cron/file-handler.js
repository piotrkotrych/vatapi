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
          return ["czynny", value];
        });

        // split json['skrotyPodatnikowCzynnych'] into chunks of 100
        const chunks = [];
        const chunkSize = 100;
        for (let i = 0; i < czynni.length; i += chunkSize) {
          chunks.push(czynni.slice(i, i + chunkSize));
        }

        console.log("File splitted into chunks");

        //create connection to database
        // const connection = mysql.createConnection({
        //   host: "localhost",
        //   user: "root",
        //   password: "chello",
        //   database: "test",
        //   port: 666,
        // });

        //insert each chunk into database
        // chunks.forEach((chunk) => {
        //   connection.query(
        //     "INSERT INTO `test`.`test` (`type`,`hash`) VALUES ?",
        //     [chunk],
        //     function (error, results, fields) {
        //       if (error) throw error;
        //       console.log("Chunk inserted into database");
        //     }
        //   );
        // });

        // //close connection
        // connection.end();

        //create pool connection to database
        const pool = mysql.createPool({
          connectionLimit: 50,
          host: "localhost",
          user: "root",
          password: "chello",
          database: "test",
          port: 666,
        });

        //insert czynni into database
        pool.query(
          "INSERT INTO `test`.`test` (`type`,`hash`) VALUES ?",
          [czynni],
          function (error, results, fields) {
            if (error) throw error;
            console.log("Czynni inserted into database");
            pool.end();
          }
        );

        // //close connection
        // pool.end();
      }
    });
  });
});

//download error
request.on("error", function (err) {
  fs.unlink(download_path);
  console.log(`Error downloading the file: ${err.message}`);
});
