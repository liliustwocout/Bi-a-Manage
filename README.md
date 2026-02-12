<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1vQDqY0XA4UjU_s1BtWzJjoJJx_HgXkhg

## Run Locally

**Prerequisites:**  
- Node.js  
- MySQL server (ví dụ: MySQL 8.x)

### 1. Cài đặt dependency

```bash
npm install
```

### 2. Cấu hình MySQL

Tạo database (ví dụ tên `cuemaster`):

```sql
CREATE DATABASE cuemaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cuemaster;
```

Backend sẽ tự tạo bảng `kv_store` khi chạy lần đầu, nên bạn không cần tạo thủ công.

Tạo file `.env` ở thư mục gốc project với nội dung (thay giá trị bằng thông tin MySQL của bạn):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cuemaster
PORT=4000
```

### 3. Cấu hình API cho frontend (tuỳ chọn)

Mặc định frontend sẽ gọi API tại `http://localhost:4000`.  
Nếu bạn muốn đổi port hoặc domain, tạo file `.env.local`:

```env
VITE_API_BASE=http://localhost:4000
GEMINI_API_KEY=your_gemini_key_here
```

Hoặc bạn có thể set biến toàn cục trong browser:

```html
<script>
  window.__CUEMASTER_API_BASE__ = 'http://localhost:4000';
</script>
```

### 4. Chạy backend (API + MySQL)

```bash
npm run server
```

Lần đầu gọi, backend sẽ tự seed dữ liệu mẫu (bàn, giá giờ, menu) vào MySQL.

### 5. Chạy frontend

Trong một terminal khác:

```bash
npm run dev
```

Ứng dụng sẽ chạy với dữ liệu được lưu trong MySQL thông qua backend Node.js.
