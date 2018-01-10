require("dotenv").config();
const request = require("request");
const moment = require("moment");
const stringify = require("json-stable-stringify");

const sendMail = require("./sendMail");
const config = require("./config");

const admin = require("firebase-admin");
const serviceAccount = require(`./${config.firebaseConfig}`);
// https://stackoverflow.com/questions/39492587/escaping-issue-with-firebase-privatekey-as-a-heroku-config-variable
serviceAccount.privateKey = config.firebasePrivateKey.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.firebaseDatabaseURL
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
const db = admin.database();
const ref = db.ref();

const options = {
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

// from 25 of December up till 4th of January
for (
  var date = moment("2018-01-20");
  date.isBefore("2018-01-21");
  date.add(1, "day")
) {
  const formatedDate = date.format("DD.MM.YYYY");
  const preservedDate = date.format("YYYY-MM-DD");
  const currentDate = moment().format("YYYY-MM-DD HH:mm:ss");
  const getLastFirebaseRecord = new Promise(resolve => {
    db
      .ref(preservedDate)
      .orderByKey()
      .limitToLast(1)
      .on("child_added", function(snapshot) {
        resolve({ preservedDate, key: snapshot.key, val: snapshot.val() });
      });
  });

  options.formData.date_dep = formatedDate;

  Promise.all([
    queryUkrZal(options),
    getLastFirebaseRecord
  ]).then(([ukrZalAnswer, firebaseAnswer]) => {
    // Since firebase doesn't store null values - we need to remove them here too
    Object.keys(ukrZalAnswer).forEach(key => {
      if (ukrZalAnswer[key] === null) delete ukrZalAnswer[key];
    });

    // Deterministic stringify
    // https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
    const ukrZalAnswerString = stringify(ukrZalAnswer);
    const firebaseAnswerString = stringify(firebaseAnswer.val);

    if (ukrZalAnswerString !== firebaseAnswerString) {
      console.log("Answers do not match!");
      console.log("firebaseAnswerString", firebaseAnswerString);
      console.log("ukrZalAnswerString", ukrZalAnswerString);
      db.ref(preservedDate).update({ [currentDate]: ukrZalAnswer });
      sendMail(`UkrZal: ${preservedDate}`, `<pre>${ukrZalAnswerString}</pre>`);
    } else {
      console.log("Matching current answer.");
      console.log({ ukrZalAnswerString, firebaseAnswerString });
    }
  });
}

function queryUkrZal(options) {
  return new Promise((resolve, reject) => {
    request(options, function(error, response, body) {
      if (error) reject(error);
      resolve(body);
    });
  });
}