# Hành Trình Di Sản Số

Website gồm React/Vite, API Express, SQLite và lưu ảnh trên ổ đĩa. Tài khoản, bài đăng, bình luận, lượt thích, địa điểm, bài viết, hành trình và trạng thái kiểm duyệt được lưu trong cơ sở dữ liệu; ảnh tải lên được lưu trong thư mục uploads.

## Yêu cầu

- Node.js 22 trở lên và npm.
- Kết nối Internet cho bản đồ, phông chữ và audio bên ngoài.

## Cấu hình lần đầu

```powershell
npm install
Copy-Item .env.example .env
```

Mở `.env`, đặt `ADMIN_EMAIL` và thay `ADMIN_PASSWORD` bằng mật khẩu ngẫu nhiên dài tối thiểu 16 ký tự. Có thể tạo mật khẩu bằng:

```powershell
node -e "console.log(require('node:crypto').randomBytes(24).toString('base64url'))"
```

`.env` không được đưa vào Git. Tài khoản Admin được tạo lần đầu khi server khởi động với hai biến `ADMIN_EMAIL` và `ADMIN_PASSWORD`; server không có mật khẩu mặc định. Nếu email đã tồn tại dưới role khác, bootstrap không tự nâng quyền tài khoản đó.

## Chạy local

1. Tạo database và nhập danh mục địa điểm/bài viết/hành trình hiện có:

```powershell
npm run db:seed
```

Seed có tính idempotent, không ghi đè nội dung đã chỉnh sửa và không tạo tài khoản, bài đăng, lượt thích hay lượt ghé thăm mẫu.

2. Mở hai terminal tại thư mục dự án. Chạy API ở terminal thứ nhất:

```powershell
npm run dev:api
```

3. Chạy frontend ở terminal thứ hai:

```powershell
npm run dev
```

Mở URL Vite hiển thị, thường là `http://localhost:3000`. Vite chuyển tiếp `/api` và `/uploads` đến API port `4000`.

## Build, test và chạy production

```powershell
npm run lint
npm test
npm run build
npm start
```

`npm start` phục vụ API và build frontend trên cùng một port. Admin đăng nhập bằng email/mật khẩu đã cấu hình trong `.env`. Người đăng ký mới luôn nhận role `user`; chỉ Admin có thể cấp role Moderator/Admin, khóa tài khoản và quản trị nội dung.

Integration tests chạy trên database tạm và tự xóa dữ liệu thử nghiệm. Luồng được kiểm tra gồm đăng ký/đăng nhập, phân quyền, upload ảnh thật, hiển thị ảnh theo trạng thái duyệt, lưu/ghé thăm, bình luận, chỉnh sửa/duyệt bài và khóa tài khoản.

## Deploy lên Internet

Không thể chỉ tải `dist/` lên Netlify/GitHub Pages vì cách đó không chạy API và không giữ được SQLite/uploads. Hãy deploy như một Node service có **persistent disk/volume**:

1. Cấu hình build command `npm install && npm run build` và start command `npm start`.
2. Thêm persistent volume và đặt `DATA_DIR` thành đường dẫn mount của volume.
3. Cấu hình `NODE_ENV=production`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` và port theo yêu cầu của host.
4. Chạy `npm run db:seed` một lần trên volume mới.
5. Dùng URL HTTPS của service để đăng nhập và quản trị.

SQLite phù hợp cho một instance ứng dụng nhỏ/vừa. Chạy nhiều instance cần chuyển sang PostgreSQL và object storage dùng chung; không đặt `DATA_DIR` trên ổ tạm của host. Gói miễn phí của nhiều host không đảm bảo persistent disk hoặc uptime, nên cần kiểm tra giới hạn và chi phí trước khi public.

Sao lưu cả `data/heritage.sqlite` và `data/uploads/`. Không xóa thư mục `data/` khi cần giữ tài khoản, bài viết hoặc ảnh đã tải lên.