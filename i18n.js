(function () {
    'use strict';

    const messages = {
        vi: {
            'meta.description': 'Trích xuất và kiểm tra deep links trực tiếp từ file APK/XAPK cực nhanh và bảo mật 100% trong trình duyệt.',
            'header.subtitle': 'Trích xuất, phân tích và kiểm tra các cấu hình Deep Link & App Link trực tiếp từ file APK hoặc XAPK nhanh chóng và an toàn 100%.',
            'upload.title': 'Kéo thả file APK hoặc XAPK của bạn',
            'upload.description': 'Hỗ trợ đầy đủ các định dạng APK chuẩn và các gói XAPK (Split APKs). Quá trình xử lý diễn ra 100% trong trình duyệt.',
            'upload.choose': 'Chọn File APK/XAPK',
            'app.defaultName': 'Ứng Dụng',
            'metadata.size': 'Dung lượng:',
            'metadata.xapk': 'Gói XAPK:',
            'metadata.copyHash': 'Nhấn để sao chép',
            'tabs.tester': 'Trình Tester',
            'deeplinks.title': 'Danh Sách Deep Links',
            'deeplinks.searchPlaceholder': 'Tìm kiếm Host, Scheme, Path...',
            'deeplinks.allFormats': 'Tất cả định dạng',
            'deeplinks.copyAllTitle': 'Sao chép toàn bộ URL đang hiển thị',
            'tester.title': 'Kiểm Tra Deep Link Hoạt Động',
            'tester.description': 'Nhập bất kỳ URL nào của bạn dưới đây để giả lập và xác minh xem ứng dụng Android có khớp định dạng và mở hoạt cảnh tương ứng hay không.',
            'tester.inputLabel': 'Nhập URL / URI test',
            'tester.placeholder': 'Ví dụ: myapp://profile/user123 hoặc https://example.com/details',
            'tester.button': 'Kiểm Tra Match',
            'manifest.title': 'AndroidManifest.xml đã giải mã',
            'loading.title': 'Đang phân tích gói tin...',
            'loading.preparingExtract': 'Đang chuẩn bị giải nén...',
            'qr.title': 'Quét QR Kiểm Tra Trực Tiếp',
            'qr.instructions': 'Sử dụng camera điện thoại hoặc máy quét mã vạch để mở deep link này trên thiết bị di động đã cài đặt ứng dụng.',
            'file.invalid': 'Vui lòng chọn file .apk hoặc .xapk',
            'file.parseFailed': 'Phân tích file thất bại: {message}',
            'hash.skipped': 'N/A (Bỏ qua cho file > 10MB)',
            'hash.calculating': 'Đang tính toán...',
            'progress.preparingFile': 'Đang chuẩn bị file...',
            'progress.openingZip': 'Đang mở gói ZIP...',
            'progress.parsingXapk': 'Đang phân tích XAPK...',
            'progress.extractingApk': 'Đang giải nén APK: {name}...',
            'progress.parsingApk': 'Đang phân tích APK...',
            'progress.decodingManifest': 'Đang giải mã AndroidManifest binary...',
            'progress.extractingLinks': 'Đang nén dữ liệu và trích xuất deep links...',
            'progress.complete': 'Hoàn thành!',
            'progress.wait': 'Vui lòng chờ...',
            'error.jszipMissing': 'Thư viện JSZip chưa được tải!',
            'error.noApkInXapk': 'Không tìm thấy file APK nào bên trong XAPK!',
            'error.manifestMissing': 'Không tìm thấy AndroidManifest.xml trong file APK!',
            'error.manifestDecode': 'Giải mã AndroidManifest.xml thất bại!',
            'error.qrLibraryMissing': 'Lỗi: Thư viện tạo mã QR chưa được tải!',
            'xapk.details': 'XAPK chứa {count} file splits. Đang giải nén: {name}',
            'deeplinks.emptyTitle': 'Không tìm thấy Deep Link nào',
            'deeplinks.emptyHint': 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.',
            'deeplinks.copyAdb': 'Sao chép câu lệnh ADB',
            'deeplinks.showQr': 'Hiển thị mã QR để quét',
            'manifest.notLoaded': 'AndroidManifest.xml chưa được tải.',
            'components.empty': 'Chưa có component nào được tải',
            'tester.matchTitle': 'KHỚP HOÀN TOÀN!',
            'tester.matchCount': 'Tìm thấy {count} Intent Filter có cấu hình phù hợp với URL này.',
            'tester.noMatchTitle': 'KHÔNG KHỚP!',
            'tester.noMatchReason': 'Không tìm thấy intent-filter nào phù hợp với URL đã nhập.',
            'tester.invalidUrl': 'URL không hợp lệ. Hãy dùng định dạng scheme://host/path',
            'clipboard.failed': 'Sao chép thất bại. Bạn vui lòng sao chép thủ công!',
            'clipboard.empty': 'Trống',
            'clipboard.copied': 'Đã sao chép'
        },
        en: {
            'meta.description': 'Extract and test deep links from APK/XAPK files quickly and securely, entirely in your browser.',
            'header.subtitle': 'Extract, analyze, and test Deep Link & App Link configurations directly from APK or XAPK files—quickly and 100% securely.',
            'upload.title': 'Drag and drop your APK or XAPK file',
            'upload.description': 'Supports standard APK files and XAPK packages (Split APKs). All processing happens entirely in your browser.',
            'upload.choose': 'Choose APK/XAPK File',
            'app.defaultName': 'Application',
            'metadata.size': 'Size:',
            'metadata.xapk': 'XAPK package:',
            'metadata.copyHash': 'Click to copy',
            'tabs.tester': 'Tester',
            'deeplinks.title': 'Deep Links',
            'deeplinks.searchPlaceholder': 'Search Host, Scheme, Path...',
            'deeplinks.allFormats': 'All formats',
            'deeplinks.copyAllTitle': 'Copy all displayed URLs',
            'tester.title': 'Test a Deep Link',
            'tester.description': 'Enter a URL below to simulate and verify whether the Android app matches its format and opens the corresponding activity.',
            'tester.inputLabel': 'Test URL / URI',
            'tester.placeholder': 'Example: myapp://profile/user123 or https://example.com/details',
            'tester.button': 'Test Match',
            'manifest.title': 'Decoded AndroidManifest.xml',
            'loading.title': 'Analyzing package...',
            'loading.preparingExtract': 'Preparing to extract...',
            'qr.title': 'Scan QR to Test',
            'qr.instructions': 'Use your phone camera or a QR scanner to open this deep link on a mobile device with the app installed.',
            'file.invalid': 'Please select an .apk or .xapk file',
            'file.parseFailed': 'Failed to analyze file: {message}',
            'hash.skipped': 'N/A (Skipped for files larger than 10MB)',
            'hash.calculating': 'Calculating...',
            'progress.preparingFile': 'Preparing file...',
            'progress.openingZip': 'Opening ZIP package...',
            'progress.parsingXapk': 'Analyzing XAPK...',
            'progress.extractingApk': 'Extracting APK: {name}...',
            'progress.parsingApk': 'Analyzing APK...',
            'progress.decodingManifest': 'Decoding binary AndroidManifest...',
            'progress.extractingLinks': 'Processing data and extracting deep links...',
            'progress.complete': 'Complete!',
            'progress.wait': 'Please wait...',
            'error.jszipMissing': 'The JSZip library has not loaded!',
            'error.noApkInXapk': 'No APK file was found inside the XAPK!',
            'error.manifestMissing': 'AndroidManifest.xml was not found in the APK!',
            'error.manifestDecode': 'Failed to decode AndroidManifest.xml!',
            'error.qrLibraryMissing': 'Error: The QR code library has not loaded!',
            'xapk.details': 'XAPK contains {count} split files. Extracting: {name}',
            'deeplinks.emptyTitle': 'No Deep Links Found',
            'deeplinks.emptyHint': 'Try adjusting the filter or your search terms.',
            'deeplinks.copyAdb': 'Copy ADB command',
            'deeplinks.showQr': 'Show QR code to scan',
            'manifest.notLoaded': 'AndroidManifest.xml is not loaded.',
            'components.empty': 'No components have been loaded',
            'tester.matchTitle': 'FULL MATCH!',
            'tester.matchCount': 'Found {count} Intent Filter(s) configured for this URL.',
            'tester.noMatchTitle': 'NO MATCH!',
            'tester.noMatchReason': 'No intent filter matches the entered URL.',
            'tester.invalidUrl': 'Invalid URL. Use the format scheme://host/path',
            'clipboard.failed': 'Copy failed. Please copy the text manually.',
            'clipboard.empty': 'Empty',
            'clipboard.copied': 'Copied'
        }
    };

    const locale = window.location.pathname === '/vi' || window.location.pathname.startsWith('/vi/')
        ? 'vi'
        : 'en';

    function t(key, params = {}) {
        const template = messages[locale][key] ?? messages.en[key] ?? key;
        return template.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? `{${name}}`);
    }

    function translateDocument() {
        document.documentElement.lang = locale;
        document.querySelectorAll('[data-i18n]').forEach(element => {
            element.textContent = t(element.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            element.placeholder = t(element.dataset.i18nPlaceholder);
        });
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            element.title = t(element.dataset.i18nTitle);
        });
        document.querySelectorAll('[data-i18n-content]').forEach(element => {
            element.content = t(element.dataset.i18nContent);
        });
    }

    window.I18n = { locale, t };
    translateDocument();
})();
