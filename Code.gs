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
  var personaData = readSheet('Persona');
  var faqData = readSheet('FAQ');
  var menuData = readSheet('Menu');
  
  var personaText = '';
  for (var i = 0; i < personaData.length; i++) {
    personaText += '- ' + personaData[i].field + ': ' + personaData[i].value + '\n';
  }
  
  var faqText = '';
  for (var j = 0; j < faqData.length; j++) {
    faqText += 'หัวข้อ: ' + faqData[j].topic + ' | คำตอบ: ' + faqData[j].answer + '\n';
  }
  
  var menuText = '';
  for (var k = 0; k < menuData.length; k++) {
    menuText += 'เมนู: ' + menuData[k].name + ' | ราคา: ' + menuData[k].price + ' | ความเผ็ด: ' + menuData[k].spice + ' | สารก่อภูมิแพ้/ส่วนผสมที่ควรระวัง: ' + menuData[k].allergens + '\n';
  }
  
  var prompt = 'คุณคือบอทผู้ช่วยของร้านอาหาร กรุณาตอบคำถามลูกค้าโดยใช้ข้อมูลและกติกาด้านล่างนี้อย่างเคร่งครัด:\n\n' +
               '[ข้อมูลบุคลิกและข้อมูลร้าน (Persona)]\n' + personaText + '\n' +
               '[ข้อมูลคำถามที่พบบ่อย (FAQ)]\n' + faqText + '\n' +
               '[ข้อมูลเมนูอาหาร (Menu)]\n' + menuText + '\n' +
               '[กติกาของบอทที่ต้องทำตามทุกข้อ]\n' +
               '1. พูดตาม Persona: ใช้ชื่อที่บอทเรียกตัวเอง คำลงท้าย สไตล์การพูด และอีโมจิตามที่กำหนดไว้ใน Persona\n' +
               '2. ตอบจากข้อมูลใน Sheet เท่านั้น ห้ามแต่งราคา โปรโมชัน หรือเวลาเปิด-ปิด ขึ้นมาเองเด็ดขาด\n' +
               '3. ถ้าไม่มีข้อมูลใน Sheet ให้ใช้ข้อความตอนไม่รู้คำตอบจาก Persona\n' +
               '4. ห้ามยืนยันการจองโต๊ะเองเด็ดขาด ให้แจ้งลูกค้าติดต่อร้านตามช่องทางติดต่อใน Persona\n' +
               '5. หากถามเรื่องแพ้อาหาร: ให้บอกส่วนผสมที่ควรระวังตามข้อมูลใน Menu และแนะนำให้แจ้งทางร้านโดยตรง ห้ามรับประกันว่าปลอดภัย 100%\n' +
               '6. หากลูกค้าไม่พอใจหรือร้องเรียน: ให้กล่าวขอโทษอย่างสุภาพ แล้วส่งต่อให้พนักงานคนจริงพร้อมแจ้งช่องทางติดต่อจาก Persona\n' +
               '7. หากถามเรื่องที่อยู่ในรายการห้ามคุย (ตามที่ระบุใน Persona): ให้ปฏิเสธอย่างสุภาพ\n' +
               '8. ตอบสั้นกระชับ ไม่เกิน 3 ประโยค และห้ามใช้ bullet list (รายการจุดหรือขีด) ในคำตอบเด็ดขาด\n\n' +
               '[คำถามจากลูกค้า]\n' + question;
  return prompt;
}

function callAI(prompt) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('AI_API_KEY');
  var primaryModel = 'gemini-3.1-flash-lite';
  var fallbackModel = 'gemini-3.5-flash';
  
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
  
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + primaryModel + ':generateContent';
  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();
  
  if (responseCode === 503 || responseCode === 429) {
    Logger.log('Primary model returned ' + responseCode + '. Retrying with fallback model: ' + fallbackModel);
    var fallbackUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + fallbackModel + ':generateContent';
    response = UrlFetchApp.fetch(fallbackUrl, options);
    responseCode = response.getResponseCode();
  }
  
  var responseText = response.getContentText();
  if (responseCode !== 200) {
    throw new Error('Gemini API Error (Status ' + responseCode + '): ' + responseText);
  }
  
  var json = JSON.parse(responseText);
  if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts) {
    var parts = json.candidates[0].content.parts;
    var fullText = '';
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].text) {
        fullText += parts[i].text;
      }
    }
    return fullText.trim();
  } else {
    throw new Error('Unexpected Gemini API response structure: ' + responseText);
  }
}

function testBot() {
  var testQuestions = [
    'ข้าวผัดกุ้งราคาเท่าไหร่',
    'แพ้กุ้ง กินต้มยำได้ไหม',
    'จองโต๊ะ 4 คน พรุ่งนี้ทุ่มนึงได้ไหม',
    'อาหารวันนี้เค็มมาก ไม่ประทับใจเลย'
  ];
  for (var i = 0; i < testQuestions.length; i++) {
    var q = testQuestions[i];
    var ans = answer(q);
    Logger.log('คำถาม: ' + q + ' -> คำตอบ: ' + ans);
  }
}
