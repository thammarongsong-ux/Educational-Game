// กำหนด ID ของ Google Sheet
const SPREADSHEET_ID = "1WIqDGDswb5ZxmYlRfpvmvVTgQxoV7jUR958X_FxcyDQ";

/**
 * ฟังก์ชันรับ request แบบ GET (ดึงข้อมูลข้อสอบทั้งหมดหรือตามวิชา)
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Questions") || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createJsonResponse({ status: "success", data: [] });
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const questions = rows.map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        if (header === "options") {
          obj[header] = row[index] ? JSON.parse(row[index]) : [];
        } else {
          obj[header] = row[index];
        }
      });
      return obj;
    });

    return createJsonResponse({ status: "success", data: questions });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * ฟังก์ชันรับ request แบบ POST (บันทึก/อัปเดตชุดข้อสอบ JSON เข้า Google Sheet)
 */
function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName("Questions");
    
    // สร้าง Sheet ใหม่และใส่ Header หากยังไม่มี
    if (!sheet) {
      sheet = ss.insertSheet("Questions");
      sheet.appendRow([
        "id", "subject", "grade", "question", 
        "options", "correctIndex", "explanation", 
        "difficulty", "hint", "points", "topicTag"
      ]);
    }
    
    const subject = contents.subject || "ทั่วไป";
    const grade = contents.grade || "-";
    const questions = contents.questions || [];
    
    questions.forEach(q => {
      sheet.appendRow([
        q.id,
        subject,
        grade,
        q.question,
        JSON.stringify(q.options),
        q.correctIndex,
        q.explanation || "",
        q.difficulty || "medium",
        q.hint || "",
        q.points || 100,
        q.topicTag || ""
      ]);
    });
    
    return createJsonResponse({ 
      status: "success", 
      message: `บันทึกข้อสอบจำนวน ${questions.length} ข้อเรียบร้อยแล้ว` 
    });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

function createJsonResponse(output) {
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}