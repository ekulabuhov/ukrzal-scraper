var request = require("request");
var sendMail = require("./sendMail");

var admin = require("firebase-admin");
var serviceAccount = require("./ukrzal-scraper-firebase-adminsdk-tqhol-7c07aa7391.json");
// https://stackoverflow.com/questions/39492587/escaping-issue-with-firebase-privatekey-as-a-heroku-config-variable
serviceAccount.privateKey = process.env.firebase_private_key.replace(
  /\\n/g,
  "\n"
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ukrzal-scraper.firebaseio.com"
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database();
var ref = db.ref();

const readFromFirebase = new Promise(resolve => {
  ref.once("value", function(snapshot) {
    resolve(snapshot.val());
  });
});

var options = {
  method: "POST",
  url: "https://booking.uz.gov.ua/purchase/search/",
  json: true,
  headers: {
    "postman-token": "e4458ab9-443a-3080-63c6-678e38a6a4ec",
    "cache-control": "no-cache",
    "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
  },
  formData: {
    station_id_from: "2200001",
    station_id_till: "2218200",
    station_from: "Київ",
    station_till: "Івано-Франківськ",
    date_dep: "29.12.2017",
    time_dep: "00:00",
    time_dep_till: "",
    another_ec: "0",
    search: ""
  }
};

const doRequest = new Promise((resolve, reject) => {
  request(options, function(error, response, body) {
    if (error) reject(error);
    resolve(body);
  });
});

Promise.all([readFromFirebase, doRequest]).then(([currentAnswer, body]) => {
  const currentAnswerString = JSON.stringify(currentAnswer, 2, 2);
  const bodyString = JSON.stringify(body, 2, 2);

  if (currentAnswerString !== bodyString) {
    console.log("Answers do not match!");
    console.log({ currentAnswerString, bodyString });
    ref.set(body);
    sendMail("Different answer!", `<pre>${bodyString}</pre>`);
  } else {
    console.log("Matching current answer.");
    // Once every hour send a ping request so I know it's alive
    if (new Date().getMinutes() <= 10) {
      sendMail("Matching answers", `<pre>${bodyString}</pre>`);
    }
  }
});
