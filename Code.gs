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
  try {
    var prompt = buildPrompt(question);
    return callAI(prompt);
  } catch (err) {
    Logger.log('Error in answer: ' + err.toString());
    return 'ขออภัยด้วยนะคะ ขณะนี้ระบบตอบกลับขัดข้องชั่วคราว กำลังเร่งแก้ไขค่ะ';
  }
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

function readSheet(name) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sheet) return [];
  
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  var headers = values[0];
  var result = [];
  
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    result.push(obj);
  }
  return result;
}

function buildPrompt(question) {
  var faqData = readSheet('FAQ');
  var faqText = '';
  
  for (var i = 0; i < faqData.length; i++) {
    faqText += 'คำถาม: ' + faqData[i].topic + '\nคำตอบ: ' + faqData[i].answer + '\n---\n';
  }
  
  var prompt = 'คุณคือผู้ช่วยตอบคำถามของร้านอาหาร ให้ตอบคำถามลูกค้าโดยใช้ข้อมูลจากรายการ FAQ ด้านล่างนี้เท่านั้น\n\n' +
               '[รายการ FAQ ของร้าน]\n' + faqText + '\n' +
               '[คำถามจากลูกค้า]\n' + question + '\n\n' +
               'กติกาการตอบอย่างเคร่งครัด:\n' +
               '1. ค้นหาคำถามลูกค้าใน FAQ หากมีคำตอบที่ตรงกันหรือใกล้เคียง ให้ตอบตามข้อมูลนั้น\n' +
               '2. หากคำถามไม่อยู่ใน FAQ หรือไม่สามารถตอบได้จากข้อมูลที่มี ให้ตอบคำว่า "ขออภัยค่ะ ขณะนี้ยังไม่มีข้อมูลเรื่องนี้ค่ะ" เท่านั้น ห้ามเดาหรือคิดคำตอบขึ้นมาเองเด็ดขาด';
  return prompt;
}

function callAI(prompt) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('AI_API_KEY');
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';
  
  var payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };
  
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();
  var responseText = response.getContentText();
  
  if (responseCode !== 200) {
    throw new Error('Gemini API Error (Status ' + responseCode + '): ' + responseText);
  }
  
  var json = JSON.parse(responseText);
  if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
    return json.candidates[0].content.parts[0].text.trim();
  } else {
    throw new Error('Unexpected Gemini API response structure: ' + responseText);
  }
}

function testBot() {
  var testQuestions = ['ร้านเปิดกี่โมงคะ', 'มีโปรอะไรไหม'];
  for (var i = 0; i < testQuestions.length; i++) {
    var q = testQuestions[i];
    var ans = answer(q);
    Logger.log('คำถาม: ' + q + ' -> คำตอบที่ได้: ' + ans);
  }
}
