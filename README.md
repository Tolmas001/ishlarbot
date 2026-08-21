# Ishlarbot

Telegram orqali ish beruvchi ish e'lon qilishi, ishchi ko'rishi va ariza yuborishi uchun TypeScript bot server.

## Nima qiladi

- Ishchi ro'yxatdan o'tadi: ism, yosh, kasb, o'z rasmi va telefon.
- Ish beruvchi ro'yxatdan o'tadi: ism/kompaniya nomi, yosh, faoliyat yo'nalishi, o'z rasmi va telefon.
- Ro'yxatdan o'tishdan oldin maxfiylik va aldov/soxta chek qilmaslik bo'yicha rozilik olinadi.
- Ishchi va ish beruvchi profillari alohida saqlanadi.
- Ishchi va ish beruvchi o'z ma'lumotlarini alohida o'zgartira oladi.
- Telefon faqat Telegram contact tugmasi orqali qabul qilinadi.
- Yosh chegarasi `.env` ichidagi `MIN_AGE` va `MAX_AGE` orqali sozlanadi.
- Ish beruvchi ish qo'shadi: ish nomi, tavsif, maosh, joylashuv, lokatsiya, ish vaqti, ovqat, ish turi va rasm.
- Yangi ish avval adminga ko'rib chiqish uchun yuboriladi.
- Admin tasdiqlasa ish `CHANNEL_ID` kanaliga chiroyli post bo'lib chiqadi.
- Ish holatlari bor: `ko'rib chiqilmoqda`, `bo'sh`, `band/yopilgan`, `rad etilgan`.
- Kanalga chiqqan e'londa `Holat: ochiq` ko'rinadi; ish yopilganda kanal posti `Holat: yopildi` deb yangilanadi.
- Botdan foydalanish uchun user kanalga a'zo bo'lishi kerak.
- Kanal postida `Ishni topshirish` tugmasi chiqadi; bosilganda bot ochilib o'sha ish tafsilotlari ko'rsatiladi.
- Ishchi ishlarni ko'radi va `Ariza yuborish` bosib ixtiyoriy xabar bilan ariza yuboradi.
- Ishchi ishlarni hudud bo'yicha qidiradi.
- Ish beruvchi o'z e'lonlarini ko'radi, yopadi, o'chiradi va arizalarni ko'radi.
- Admin `/admin` orqali statistika va barcha e'lonlarni ko'radi.
- Admin paneldan `Ish qo'shish` orqali ish yaratadi va `Kanalga chiqarish` tugmasi bilan kanalga joylaydi.
- Admin `Barcha userlar` orqali saqlangan user ma'lumotlarini rasm bilan ko'radi.
- Har bir jarayonda `Qaytish` tugmasi asosiy menyuga qaytaradi.
- Server holatini brauzerda ko'rish mumkin: `http://localhost:3000`.

## Ishga tushirish

1. Telegramdagi `@BotFather` orqali bot oching va token oling.
2. `.env.example` faylidan `.env` fayl yarating.
3. `.env` ichiga tokenni yozing:

```env
BOT_TOKEN=tokeningiz
PORT=3000
BOT_USERNAME=bot_nomi
MIN_AGE=16
MAX_AGE=100
ADMIN_IDS=123456789
CHANNEL_ID=@kanal_username
```

4. Kerakli paketlarni o'rnating:

```bash
npm install
```

5. Development rejimida ishga tushiring:

```bash
npm run dev
```

6. Production uchun build qiling va ishga tushiring:

```bash
npm run build
npm start
```

## Fayllar

- `src/index.ts` - loyihani ishga tushirish.
- `src/server.ts` - Express server va botni ishga tushirish.
- `src/api/routes.ts` - `GET /jobs`, `POST /jobs`, `POST /apply`.
- `src/bot/bot.ts` - Telegram bot handlerlarini ulash.
- `src/bot/flows/` - ro'yxatdan o'tish, ish qo'shish, ishlarni ko'rish va ariza yuborish flowlari.
- `src/bot/formatters.ts` - bot va kanal xabar matnlari.
- `src/bot/keyboards.ts` - Telegram menyular.
- `src/database/jsonDb.ts` - JSON bazaga o'qish/yozish.
- `src/services/` - ish, ariza va xabarnoma logikasi.
- `src/types.ts` - TypeScript tiplari.
- `data/db.json` - bot ishlaganda avtomatik yaratiladigan ma'lumotlar bazasi.

## API

```http
GET /jobs
GET /jobs?location=Toshkent
POST /jobs
POST /apply
```

`POST /jobs` uchun yuboriladigan ma'lumot:

```json
{
  "employerTelegramId": "123456",
  "title": "G'isht teruvchi kerak",
  "description": "2 haftalik ish",
  "salary": "150 000 so'm / kun",
  "location": "Toshkent, Chilonzor",
  "geoLocation": "https://maps.google.com/?q=41.2995,69.2401",
  "workTime": "08:00-18:00",
  "meals": "2 mahal",
  "difficulty": "heavy",
  "photoFileId": null
}
```

`POST /apply` uchun yuboriladigan ma'lumot:

```json
{
  "jobId": "job_123",
  "userId": "user_123",
  "message": "Bugun boshlay olaman"
}
```
