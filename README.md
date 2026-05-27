# 🔗 Link Auditor - Android Deep Link Extractor & Tester

Ứng dụng web cao cấp giúp phân tích, giải mã và hiển thị tất cả các cấu hình **Deep Link** (Custom Schemes) & **App Links** (HTTP/HTTPS) từ các tệp ứng dụng **APK** và **XAPK** (Split APKs) ngay lập tức trong trình duyệt.

Toàn bộ quá trình giải mã, phân tích mã nguồn nhị phân nhị phân `AndroidManifest.xml` diễn ra hoàn toàn **client-side** (offline) bằng Javascript. File ứng dụng không bao giờ tải lên bất kỳ máy chủ nào, đảm bảo bảo mật và tốc độ tối đa!

---

## ✨ Các Tính Năng Nổi Bật

1. **Hỗ trợ XAPK (Split APKs) & APK**: Tự động giải nén gói XAPK, lọc các gói Split và phân tích tệp `base.apk` lõi mà không cần bất kỳ công cụ dòng lệnh nào.
2. **Bộ lọc & Tìm kiếm thông minh**: Lọc các link theo dạng `App Links (HTTP/S)` hoặc `Custom Schemes (myapp://)` và tìm kiếm thời gian thực theo activity, host, scheme hoặc path.
3. **Trình Tester thời gian thực**: Nhập bất kỳ URL kiểm tra nào, hệ thống sẽ dịch các quy tắc wildcard của Android (ví dụ: `.*`, `*`) thành Regular Expressions và xác minh chính xác hoạt cảnh nào sẽ được mở trên Android, hiển thị cảnh báo Match rõ ràng.
4. **Tạo câu lệnh ADB Shell**: Tự động sinh ra các câu lệnh `adb shell am start` hoàn chỉnh cho từng deep link giúp nhà phát triển dễ dàng copy và chạy test trên thiết bị thật/giả lập.
5. **Hiển thị mã QR động**: Hiển thị QR code cho từng link, cho phép bạn cầm điện thoại lên quét camera và test ứng dụng ngay tại chỗ.
6. **Xem Manifest đã dịch ngược**: Hiển thị toàn bộ file cấu hình `AndroidManifest.xml` dưới định dạng XML chuẩn, thụt lề đẹp mắt để bạn dễ dàng đối chiếu.

---

## 🚀 Hướng Dẫn Chạy Ứng Dụng

Ứng dụng được thiết kế hoàn toàn tĩnh (Static SPA) nên bạn có hai cách cực kỳ linh hoạt để khởi động:

### Cách 1: Chạy trực tiếp (Không cần cài đặt)
Do hoạt động hoàn toàn bằng Javascript độc lập trong browser, bạn chỉ cần:
1. Mở thư mục `apkaudit/`
2. Click đúp chuột vào file [index.html](file:///e:/Code/apkaudit/index.html) để mở nó bằng Google Chrome, Microsoft Edge hoặc Firefox.
3. Bắt đầu kéo thả APK/XAPK và tận hưởng!

### Cách 2: Chạy thông qua Node.js Dev Server (Khuyên Dùng cho Devs)
Nếu bạn muốn sử dụng các cơ chế Hot Reload, chỉnh sửa code hoặc tránh các giới hạn bảo mật cục bộ của browser:
1. Đảm bảo bạn đã cài đặt Node.js.
2. Mở terminal tại thư mục workspace và chạy lệnh để cài đặt Vite (cực kỳ nhẹ):
   ```bash
   npm install
   ```
3. Khởi động server phát triển:
   ```bash
   npm run dev
   ```
4. Truy cập địa chỉ hiển thị trong terminal (thường là `http://localhost:5173`) trong trình duyệt của bạn.

---

## 🛠️ Cấu trúc dự án

- **`index.html`**: Giao diện người dùng với cấu trúc HTML5 hiện đại, các khu vực dashboard, tester và modal.
- **`style.css`**: Hệ thống CSS Vanilla cao cấp với các hiệu ứng kính mờ (glassmorphism), các vòng lặp loading động và thiết kế Responsive.
- **`parser.js`**: Trái tim của ứng dụng. Chứa class `AXMLParser` giải mã binary XML, hàm trích xuất deep link, và công cụ regex matcher.
- **`app.js`**: Điều phối viên ứng dụng. Quản lý luồng unzipping, cập nhật giao diện, tính toán mã băm SHA-256/MD5 và kết nối các tab tương tác.
- **`package.json`**: Cấu hình các lệnh chạy phát triển bằng Vite.

---

## 🔐 Bảo mật 100%

Link Auditor được cam kết bảo mật tuyệt đối:
- Không có bất kỳ API request nào tải file APK của bạn lên máy chủ bên ngoài.
- File ZIP được phân tách cục bộ thành `ArrayBuffer` trực tiếp trong RAM của trình duyệt của bạn.
- An toàn tuyệt đối để phân tích các ứng dụng nội bộ, ứng dụng bảo mật của doanh nghiệp.
