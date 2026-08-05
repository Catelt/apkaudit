# Link Auditor — Công cụ trích xuất và kiểm thử Android Deep Link

[English](README.md) | [Tiếng Việt](README.vi.md)

**Dùng trực tuyến:** [https://apkaudit.catelt.com/vi/](https://apkaudit.catelt.com/vi/)

Link Auditor giúp trích xuất và hiển thị **Deep Link** (custom scheme) cùng **App Link** (HTTP/HTTPS) từ các tệp **APK** và **XAPK** ngay trong trình duyệt.

Toàn bộ quá trình giải mã và phân tích tệp nhị phân `AndroidManifest.xml` diễn ra hoàn toàn ở **phía trình duyệt**. Tệp ứng dụng không được tải lên máy chủ, giúp bảo đảm tính riêng tư và tốc độ xử lý.

---

## Tính năng

1. **Hỗ trợ APK và XAPK** — Tự động giải nén gói XAPK, nhận diện các split package và phân tích tệp lõi `base.apk` mà không cần công cụ dòng lệnh.
2. **Bộ lọc và tìm kiếm thông minh** — Lọc App Link hoặc custom scheme và tìm kiếm theo thời gian thực bằng activity, host, scheme hoặc path.
3. **Kiểm thử URL theo thời gian thực** — Chuyển các quy tắc wildcard của Android như `.*` và `*` thành biểu thức chính quy, sau đó hiển thị activity phù hợp với URL kiểm thử.
4. **Tạo lệnh ADB** — Sinh đầy đủ lệnh `adb shell am start` để kiểm thử từng deep link trên thiết bị thật hoặc máy ảo.
5. **Mã QR** — Tạo mã QR cho từng liên kết để mở nhanh trên thiết bị di động.
6. **Xem manifest đã giải mã** — Hiển thị `AndroidManifest.xml` đã giải mã dưới dạng XML được định dạng dễ đọc.

---

## Bắt đầu

### Cách 1: Mở trực tiếp

Ứng dụng là một SPA tĩnh và chạy hoàn toàn trong trình duyệt:

1. Mở thư mục dự án.
2. Mở tệp `index.html` bằng Chrome, Edge hoặc Firefox.
3. Kéo thả tệp APK hoặc XAPK vào trang.

### Cách 2: Dùng máy chủ phát triển

Dùng máy chủ Vite để có hot reload và thuận tiện khi phát triển:

```bash
npm install
npm run dev
```

Sau đó mở địa chỉ hiển thị trong terminal, thường là `http://localhost:5173`.

Để tạo bản build production:

```bash
npm run build
```

---

## Cấu trúc dự án

- `index.html` — Giao diện chính và bố cục ứng dụng.
- `style.css` — Giao diện responsive và các hiệu ứng hình ảnh.
- `parser.js` — Bộ giải mã XML nhị phân, trích xuất deep link và đối chiếu URL.
- `app.js` — Xử lý tệp, trạng thái giao diện, mã băm và các tính năng tương tác.
- `i18n.js` — Bản dịch giao diện tiếng Anh và tiếng Việt.
- `package.json` — Các lệnh Vite và dependency của dự án.

---

## Quyền riêng tư

- Tệp APK và XAPK không được tải lên máy chủ bên ngoài.
- Nội dung gói được xử lý cục bộ dưới dạng `ArrayBuffer` trong bộ nhớ trình duyệt.
- Công cụ phù hợp để phân tích ứng dụng riêng tư hoặc ứng dụng nội bộ.
