# 🎋 Telegram Bot Lịch Việt (MVP - Tra Cứu)

Bot Telegram để tra cứu Lịch Việt Nam (Âm/Dương lịch) với khả năng tạo ảnh lịch tháng động, sử dụng AI (Google Gemini) để hiểu ngôn ngữ tự nhiên.

## ✨ Tính năng

### 🎯 MVP Features (Stateless - No Database)

1. **Tra cứu ngày hôm nay**
   - Hiển thị thông tin Dương lịch, Âm lịch, Can Chi
   - Nhận diện ngày Rằm, Mồng 1
   - Hiển thị ngày lễ (nếu có)

2. **Xem lịch tháng (Image Generation)**
   - Tạo ảnh lịch tháng đầy đủ
   - Highlight: Chủ Nhật (đỏ), Rằm/Mồng 1 (vàng), Ngày lễ (xanh)
   - Hiển thị cả ngày Dương và Âm trên mỗi ô

3. **Đếm ngược ngày lễ**
   - Tính số ngày còn lại đến ngày lễ (Tết, Giỗ Tổ, Vu Lan...)
   - Hỗ trợ cả lễ Âm và Dương

4. **NLU với Gemini AI**
   - Hiểu ngôn ngữ tự nhiên (ví dụ: "Tết còn mấy ngày?", "xem lịch tháng 12")
   - Cache thông minh để tránh Rate Limit

## 🏗️ Tech Stack

- **Runtime**: Node.js 20.x
- **Language**: TypeScript 5.x
- **Bot Framework**: Telegraf 4.x
- **AI/NLU**: Google Gemini API (`@google/generative-ai`)
- **Lunar Calendar**: `lunar-javascript` (Thư viện lịch âm Việt)
- **Image Generation**: `node-canvas` (Server-side Canvas)
- **Caching**: `node-cache` (In-memory cache)

## 📁 Cấu trúc dự án

```
chatbotzl/
├── src/
│   ├── index.ts                    # Telegram bot entry point
│   ├── config.ts                   # Environment config
│   ├── types.ts                    # TypeScript types
│   ├── data/
│   │   └── holidays.json           # Danh sách ngày lễ
│   ├── controllers/
│   │   └── telegram.controller.ts  # Message handlers
│   ├── services/
│   │   ├── 1_nlu.service.ts        # Gemini AI + Cache
│   │   ├── 2_calendar.service.ts   # Lịch âm logic
│   │   ├── 3_image.service.ts      # Canvas image gen
│   │   └── 4_telegram.service.ts   # Telegram API
│   └── utils/
│       └── date.utils.ts           # Date helpers
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚀 Cài đặt & Chạy

### Yêu cầu

- Node.js >= 20.0.0
- npm hoặc yarn
- Telegram Bot Token (từ @BotFather)
- Google Gemini API Key

### Bước 1: Tạo Telegram Bot

1. Mở Telegram và tìm **@BotFather**
2. Gửi lệnh `/newbot`
3. Đặt tên cho bot (ví dụ: "Lịch Việt Bot")
4. Đặt username cho bot (phải kết thúc bằng "bot", ví dụ: "lichviet_bot")
5. Copy **HTTP API Token** mà BotFather gửi cho bạn

### Bước 2: Clone & Install

```bash
git clone <repository-url>
cd chatbotzl
npm install
```

**Lưu ý về canvas**: Nếu gặp lỗi khi install canvas, xem phần [Troubleshooting](#-troubleshooting) bên dưới.

### Bước 3: Cấu hình Environment

Copy file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Sau đó chỉnh sửa `.env` với thông tin thực:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ

# Gemini (lấy từ https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Bước 4: Chạy Bot

**Development mode:**

```bash
npm run dev
```

**Production mode:**

```bash
npm run build
npm start
```

### Bước 5: Test Bot

1. Mở Telegram
2. Tìm bot của bạn (username bạn đã tạo)
3. Gửi `/start` để bắt đầu
4. Thử các câu lệnh:
   - `"hôm nay ngày mấy"` → Bot trả lời thông tin ngày
   - `"xem lịch tháng 12"` → Bot gửi ảnh lịch tháng 12
   - `"Tết còn mấy ngày"` → Bot đếm ngược đến Tết
   - `/help` → Xem hướng dẫn

## 🐳 Chạy với Docker

### Build & Run

```bash
docker-compose up -d
```

### View Logs

```bash
docker-compose logs -f
```

### Stop

```bash
docker-compose down
```

## 📦 Deploy lên Production

### Option 1: VPS (Ubuntu/Debian) - Recommended

```bash
# SSH vào VPS
ssh user@your-server.com

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies for canvas
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Clone & setup
git clone <your-repo>
cd chatbotzl
npm install
npm run build

# Run with PM2
npm install -g pm2
pm2 start dist/index.js --name telegram-lunar-bot
pm2 save
pm2 startup
```

### Option 2: Render.com

1. Push code lên GitHub
2. Tạo Web Service trên [Render](https://render.com/)
3. Connect GitHub repo
4. Cấu hình:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables: Copy từ `.env`

### Option 3: Railway.app

1. Push code lên GitHub
2. Tạo project mới trên [Railway](https://railway.app/)
3. Connect GitHub repo
4. Add environment variables
5. Deploy

### Option 4: Docker (bất kỳ platform nào)

```bash
# Build image
docker build -t telegram-lunar-bot .

# Run container
docker run -d \
  --name lunar-bot \
  --env-file .env \
  telegram-lunar-bot
```

## 🎨 Ví dụ sử dụng

| Tin nhắn người dùng | Ý định (Intent) | Response |
|---------------------|-----------------|----------|
| `/start` | Command | Thông báo chào mừng |
| `/help` | Command | Hướng dẫn sử dụng |
| "hôm nay" | `GET_TODAY_INFO` | Text: Thông tin ngày (Dương, Âm, Can Chi) |
| "xem lịch tháng 12" | `GET_MONTH_CALENDAR` | Photo: Lịch tháng 12 |
| "Tết còn mấy ngày?" | `GET_HOLIDAY_COUNTDOWN` | Text: Còn X ngày |
| "danh sách lễ" | `GET_HOLIDAY_LIST` | Text: Tất cả ngày lễ |

## 🛠️ Scripts

```bash
npm run dev        # Chạy development với ts-node-dev
npm run build      # Build TypeScript -> JavaScript
npm start          # Chạy production (dist/)
```

## 🔒 Security

- ✅ Telegram Bot API tự động xác thực
- ✅ Environment variables cho sensitive data
- ✅ No hardcoded secrets

## 📊 Performance

- **NLU Cache**: Giảm 90% request đến Gemini
- **Image Cache**: TTL 24h cho mỗi ảnh lịch
- **Response Time**: < 3 giây (bao gồm image generation)
- **Long Polling**: Bot tự động reconnect nếu mất kết nối

## 🧪 Testing

Để test các service riêng lẻ:

```typescript
// test.ts
import { nluService } from './src/services/1_nlu.service';
import { calendarService } from './src/services/2_calendar.service';

async function test() {
  // Test NLU
  const intent = await nluService.parseIntent('Tết còn mấy ngày');
  console.log(intent);

  // Test Calendar
  const today = calendarService.getTodayInfo();
  console.log(today);
}

test();
```

Chạy: `ts-node test.ts`

## 🚧 Roadmap (Future)

Nếu muốn nâng cấp lên **Full Version**:

1. **Database** (Supabase/PostgreSQL)
   - Lưu user IDs
   - Lưu preferences (timezone, language)

2. **Nhắc nhở tự động**
   - User đăng ký: `/subscribe`
   - CRON job gửi tin nhắn mỗi sáng

3. **Inline Mode**
   - Cho phép dùng bot trong các chat khác
   - Ví dụ: `@lichviet_bot tháng 12`

4. **Webhook Mode**
   - Thay thế long polling bằng webhook (faster)
   - Cần HTTPS endpoint

## 📄 License

MIT License

## 🙏 Credits

- **Lịch âm**: [lunar-javascript](https://github.com/6tail/lunar-javascript)
- **AI**: Google Gemini
- **Canvas**: [node-canvas](https://github.com/Automattic/node-canvas)
- **Telegram**: [Telegraf](https://github.com/telegraf/telegraf)

## 🐛 Troubleshooting

### Lỗi: Canvas install failed

**Trên Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
npm install
```

**Trên macOS:**
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
npm install
```

**Trên Windows:**
- Cài đặt [Windows Build Tools](https://github.com/felixrieseberg/windows-build-tools)
- Hoặc sử dụng Docker (khuyến nghị)

### Lỗi: Gemini Rate Limit

- Kiểm tra cache có hoạt động không
- Tăng `CACHE_TTL` trong `.env` (ví dụ: 7200 = 2 giờ)
- Sử dụng fallback pattern matching khi Gemini fail

### Lỗi: Bot không nhận tin nhắn

- Kiểm tra `TELEGRAM_BOT_TOKEN` có đúng không
- Đảm bảo không có bot khác đang chạy với cùng token
- Check logs để xem lỗi chi tiết: `npm run dev`

### Bot bị crash khi generate ảnh

- Kiểm tra canvas đã cài đúng chưa
- Test bằng cách chạy một ví dụ đơn giản:

```javascript
const { createCanvas } = require('canvas');
const canvas = createCanvas(200, 200);
console.log('Canvas OK!');
```

## 📞 Support

Nếu gặp vấn đề, tạo issue trên GitHub.

## 🌟 Features Highlights

- ✅ **100% TypeScript** - Type-safe code
- ✅ **AI-powered NLU** - Hiểu ngôn ngữ tự nhiên
- ✅ **Beautiful Calendar Images** - Tạo ảnh động
- ✅ **Smart Caching** - Tối ưu performance
- ✅ **Stateless** - Không cần database
- ✅ **Docker Ready** - Deploy dễ dàng
- ✅ **Vietnamese Holidays** - Đầy đủ ngày lễ VN

---

**Made with ❤️ for Vietnamese Lunar Calendar enthusiasts**

**Hỗ trợ Telegram Bot API** | **Powered by Google Gemini AI**
