# 🎋 Zalo Bot Lịch Việt (MVP - Tra Cứu)

Chatbot Zalo Official Account (OA) để tra cứu Lịch Việt Nam (Âm/Dương lịch) với khả năng tạo ảnh lịch tháng động, sử dụng AI (Google Gemini) để hiểu ngôn ngữ tự nhiên.

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
- **Framework**: Express.js
- **AI/NLU**: Google Gemini API (`@google/generative-ai`)
- **Lunar Calendar**: `lunar-javascript` (Thư viện lịch âm Việt)
- **Image Generation**: `node-canvas` (Server-side Canvas)
- **Caching**: `node-cache` (In-memory cache)
- **HTTP Client**: `axios`

## 📁 Cấu trúc dự án

```
chatbotzl/
├── src/
│   ├── index.ts                    # Express server
│   ├── config.ts                   # Environment config
│   ├── types.ts                    # TypeScript types
│   ├── data/
│   │   └── holidays.json           # Danh sách ngày lễ
│   ├── controllers/
│   │   └── zalo.controller.ts      # Webhook handler
│   ├── services/
│   │   ├── 1_nlu.service.ts        # Gemini AI + Cache
│   │   ├── 2_calendar.service.ts   # Lịch âm logic
│   │   ├── 3_image.service.ts      # Canvas image gen
│   │   └── 4_zalo.service.ts       # Zalo API
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
- Zalo OA (Official Account) - [Đăng ký tại đây](https://oa.zalo.me/)
- Google Gemini API Key - [Lấy tại đây](https://aistudio.google.com/app/apikey)

### Bước 1: Clone & Install

```bash
git clone <repository-url>
cd chatbotzl
npm install
```

### Bước 2: Cấu hình Environment

Copy file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Sau đó chỉnh sửa `.env` với thông tin thực:

```env
# Zalo OA
ZALO_OA_ID=your_oa_id
ZALO_ACCESS_TOKEN=your_access_token
ZALO_APP_SECRET=your_app_secret

# Gemini
GEMINI_API_KEY=your_gemini_api_key
```

#### Cách lấy Zalo credentials:

1. Truy cập [Zalo Developers](https://developers.zalo.me/)
2. Tạo hoặc chọn OA của bạn
3. Vào **Settings** > **Webhook** > Lấy `ZALO_APP_SECRET`
4. Vào **Settings** > **API** > Lấy `ZALO_ACCESS_TOKEN`

### Bước 3: Chạy Development

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

### Bước 4: Expose Webhook (ngrok)

Zalo cần một URL công khai để gửi webhook. Sử dụng ngrok:

```bash
ngrok http 3000
```

Copy URL ngrok (ví dụ: `https://abc123.ngrok.io`) và cấu hình webhook Zalo:

1. Truy cập [Zalo Developers](https://developers.zalo.me/)
2. Chọn OA > **Webhook Settings**
3. Nhập URL: `https://abc123.ngrok.io/zalo`
4. Verify và Enable

### Bước 5: Test Bot

Mở Zalo, tìm OA của bạn và gửi tin nhắn:

- `"hôm nay ngày mấy"` → Bot trả lời thông tin ngày
- `"xem lịch tháng 12"` → Bot gửi ảnh lịch tháng 12
- `"Tết còn mấy ngày"` → Bot đếm ngược đến Tết

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

### Option 1: Vercel (Serverless)

**Lưu ý**: Vercel có giới hạn với canvas. Nên dùng Render hoặc VPS.

### Option 2: Render.com (Recommended)

1. Push code lên GitHub
2. Tạo Web Service trên [Render](https://render.com/)
3. Connect GitHub repo
4. Cấu hình:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables: Copy từ `.env`

### Option 3: VPS (Ubuntu/Debian)

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
pm2 start dist/index.js --name zalo-bot
pm2 save
pm2 startup
```

## 🎨 Ví dụ sử dụng

| Tin nhắn người dùng | Ý định (Intent) | Response |
|---------------------|-----------------|----------|
| "hôm nay" | `GET_TODAY_INFO` | Text: Thông tin ngày (Dương, Âm, Can Chi) |
| "xem lịch tháng 12" | `GET_MONTH_CALENDAR` | Image: Lịch tháng 12 |
| "Tết còn mấy ngày?" | `GET_HOLIDAY_COUNTDOWN` | Text: Còn X ngày |
| "danh sách lễ" | `GET_HOLIDAY_LIST` | Text: Tất cả ngày lễ |

## 🛠️ Scripts

```bash
npm run dev        # Chạy development với ts-node
npm run build      # Build TypeScript -> JavaScript
npm start          # Chạy production (dist/)
```

## 🧪 Testing

Để test NLU và Calendar logic riêng lẻ, bạn có thể tạo file test:

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

## 🔒 Security

- ✅ Xác thực Zalo signature (`X-Zalo-Signature`)
- ✅ Environment variables cho sensitive data
- ✅ No hardcoded secrets

## 📊 Performance

- **NLU Cache**: Giảm 90% request đến Gemini
- **Image Cache**: TTL 24h cho mỗi ảnh lịch
- **Response Time**: < 3 giây (bao gồm image generation)

## 🚧 Roadmap (Future)

Nếu muốn nâng cấp lên **Full Version** (không còn stateless):

1. **Database** (Supabase/PostgreSQL)
   - Lưu user IDs
   - Lưu preferences

2. **Nhắc nhở tự động**
   - User đăng ký: `/nhac_ram`
   - CRON job gửi tin nhắn mỗi sáng

3. **Admin Dashboard**
   - Xem analytics
   - Quản lý users

## 📄 License

MIT License

## 🙏 Credits

- **Lịch âm**: [lunar-javascript](https://github.com/6tail/lunar-javascript)
- **AI**: Google Gemini
- **Canvas**: [node-canvas](https://github.com/Automattic/node-canvas)

## 🐛 Troubleshooting

### Lỗi: Canvas install failed

Trên Linux (Ubuntu/Debian):
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

Trên macOS:
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

### Lỗi: Gemini Rate Limit

- Kiểm tra cache có hoạt động không
- Tăng `CACHE_TTL` trong `.env`
- Sử dụng fallback pattern matching

### Lỗi: Zalo signature verification failed

- Kiểm tra `ZALO_APP_SECRET` có đúng không
- Đảm bảo body của request không bị modify trước khi verify

## 📞 Support

Nếu gặp vấn đề, tạo issue trên GitHub hoặc liên hệ qua email.

---

**Made with ❤️ for Vietnamese Lunar Calendar enthusiasts**
