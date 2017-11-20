var request = require("request");
var sendMail = require("./sendMail");
var currentAnswer = require("./currentAnswer.json");

var options = { method: 'POST',
  url: 'https://booking.uz.gov.ua/purchase/search/',
  json: true,
  headers: 
   { 'postman-token': 'e4458ab9-443a-3080-63c6-678e38a6a4ec',
     'cache-control': 'no-cache',
     'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
  formData: 
   { station_id_from: '2200001',
     station_id_till: '2218200',
     station_from: 'Київ',
     station_till: 'Івано-Франківськ',
     date_dep: '29.12.2017',
     time_dep: '00:00',
     time_dep_till: '',
     another_ec: '0',
     search: '' } };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);

  const currentAnswerString = JSON.stringify(currentAnswer, 2, 2);
  const bodyString = JSON.stringify(body, 2, 2);

  if (currentAnswerString !== bodyString) {
    console.log("Answers do not match!");
    console.log({currentAnswerString, bodyString})
    sendMail("Different answer!", `<pre>${bodyString}</pre>`);
  } else {
    console.log("Matching current answer.");    
    sendMail("Matching answers", `<pre>${bodyString}</pre>`);
  }
});
