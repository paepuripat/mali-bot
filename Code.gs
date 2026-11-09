function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var events = data.events || [];
    
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      if (event.type === 'message' && event.message && event.message.type === 'text') {
        var userMessage = event.message.text;
        var replyText = answer(userMessage);
        replyToLine(event.replyToken, replyText);
      }
    }
  } catch (err) {
    Logger.log('Error in doPost: ' + err.toString());
  }
  return ContentService.createTextOutput('OK');
}

function answer(question) {
  return 'ได้รับข้อความ: ' + question;
}

function replyToLine(replyToken, text) {
  var token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  var url = 'https://api.line.me/v2/bot/message/reply';
  var payload = {
    replyToken: replyToken,
    messages: [
      {
        type: 'text',
        text: text
      }
    ]
  };
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(url, options);
}

function testBot() {
  var sampleQuestion = 'สวัสดี';
  var reply = answer(sampleQuestion);
  Logger.log(reply);
}
