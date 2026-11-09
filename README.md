# mali-bot

บอท LINE OA ของร้านตัวอย่าง **ครัวมะลิ** รันบน Google Apps Script อ่านข้อมูลร้านจาก Google Sheet แล้วใช้ Gemini ตอบลูกค้า

- คู่มือทีละขั้น: https://puripat.com/guides/line-oa-bot
- ทำสำเนา Sheet ข้อมูลตัวอย่าง: https://docs.google.com/spreadsheets/d/1vx6fmcUhU7fDa48gPYti6blZhsRM6VPaJKVgyDL-YM0/copy
- `Code.gs` คือโค้ดบอท ส่วน `sheet/` คือข้อมูลตัวอย่าง แยกไฟล์ละแท็บ

**คีย์ทั้งหมดเก็บใน Script Properties (`LINE_CHANNEL_ACCESS_TOKEN`, `AI_API_KEY`) ห้ามใส่ไว้ในโค้ด**

โค้ดของแต่ละ milestone อยู่ที่ tag `m1` (ทวนข้อความ), `m2` (ตอบจาก FAQ), `m3` (Persona + Menu), `m4` (ชุดทดสอบ)
