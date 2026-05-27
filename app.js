/**
 * app.js
 * Main frontend controller for managing file uploads, unzipping packages,
 * updating UI, running regex matches, and showing test helpers.
 */

(function () {
    'use strict';

    // Application state
    const State = {
        arrayBuffer: null,
        fileName: '',
        fileSize: 0,
        packageType: '', // 'APK' or 'XAPK'
        packageName: '',
        appLabel: '',
        versionName: '',
        versionCode: '',
        minSdk: null,
        targetSdk: null,
        sha256: '',
        md5: '',
        manifestStr: '',
        deepLinks: [],
        components: [],
        currentOpenFile: null,
        activeTab: 'deeplinks', // 'deeplinks', 'tester', 'xml', 'components'
        searchQuery: '',
        filterType: 'all', // 'all', 'applinks', 'custom'
    };

    // DOM helper
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    // Initialize application
    document.addEventListener('DOMContentLoaded', () => {
        setupEventListeners();
        resetAppUI();
    });

    function setupEventListeners() {
        const dropzone = $('#dropzone');
        const fileInput = $('#fileInput');

        // Drag & Drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFileSelection(e.dataTransfer.files[0]);
            }
        });

        // Click to upload
        dropzone.addEventListener('click', (e) => {
            // Prevent recursive trigger when clicking input itself
            if (e.target === fileInput) return;
            
            fileInput.value = ''; // Reset to allow selecting the same file again
            fileInput.click();
        });

        fileInput.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling up to dropzone
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelection(e.target.files[0]);
            }
        });

        // Prevent default drag/drop behaviors globally to avoid page navigation on missed drops
        window.addEventListener('dragover', (e) => {
            e.preventDefault();
        }, false);
        window.addEventListener('drop', (e) => {
            e.preventDefault();
        }, false);

        // Click to reset
        $$('#logoHome, #btnResetUpload').forEach(el => {
            el.addEventListener('click', () => {
                resetAppUI();
            });
        });

        // Tab switches
        $$('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                switchTab(btn.dataset.tab);
            });
        });

        // Deep link search & filters
        $('#searchInput').addEventListener('input', (e) => {
            State.searchQuery = e.target.value;
            renderDeepLinksList();
        });

        $('#filterSelect').addEventListener('change', (e) => {
            State.filterType = e.target.value;
            renderDeepLinksList();
        });

        // Deep Link Tester Input
        $('#testUrlInput').addEventListener('input', () => {
            runDeepLinkTester();
        });

        $('#testBtn').addEventListener('click', () => {
            runDeepLinkTester();
        });

        // Modal QR Code close
        $('#closeModal').addEventListener('click', () => {
            hideQrModal();
        });

        $('#qrModalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'qrModalOverlay') {
                hideQrModal();
            }
        });
    }

    function resetAppUI() {
        State.arrayBuffer = null;
        State.fileName = '';
        State.fileSize = 0;
        State.deepLinks = [];
        State.components = [];
        State.manifestStr = '';
        State.activeTab = 'deeplinks';
        State.searchQuery = '';
        State.filterType = 'all';

        $('#searchInput').value = '';
        $('#filterSelect').value = 'all';
        $('#testUrlInput').value = '';
        $('#testResultAlert').style.display = 'none';

        $('#landingSection').style.display = 'block';
        $('#dashboardSection').classList.remove('active');
        hideProgress();
    }

    async function handleFileSelection(file) {
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'apk' && ext !== 'xapk') {
            alert('Vui lòng chọn file .apk hoặc .xapk');
            return;
        }

        // Reset pristine UI and State elements before parsing the new file
        resetAppUI();

        State.fileName = file.name;
        State.fileSize = file.size;
        State.packageType = ext.toUpperCase();

        showProgress(0, 'Đang chuẩn bị file...');

        try {
            State.arrayBuffer = await file.arrayBuffer();
            
            // Calculate hashes in parallel with loading
            calculateHashes(State.arrayBuffer);

            await parseMobilePackage(State.arrayBuffer, file.name);
        } catch (e) {
            console.error('Lỗi khi phân tích gói:', e);
            alert('Phân tích file thất bại: ' + e.message);
            hideProgress();
        }
    }

    async function calculateHashes(buffer) {
        try {
            State.sha256 = await sha256hex(buffer);
            
            // Skip MD5 calculation for files larger than 10MB to prevent UI freezing
            if (buffer.byteLength < 10 * 1024 * 1024) {
                State.md5 = await md5hex(buffer);
            } else {
                State.md5 = 'N/A (Bỏ qua cho file > 10MB)';
            }
            
            // Update sidebar immediately if finished after parsing
            if ($('#sidebarSha256')) {
                $('#sidebarSha256').textContent = State.sha256;
                $('#sidebarSha256').title = State.sha256;
            }
            if ($('#sidebarMd5')) {
                $('#sidebarMd5').textContent = State.md5;
            }
        } catch (err) {
            console.error('Hash calculation error:', err);
        }
    }

    async function parseMobilePackage(arrayBuffer, fileName) {
        showProgress(15, 'Đang mở gói ZIP...');
        if (typeof JSZip === 'undefined') {
            throw new Error('Thư viện JSZip chưa được tải!');
        }

        const zip = await JSZip.loadAsync(arrayBuffer);
        let apkBuffer = arrayBuffer;
        let apkName = fileName;
        let xapkDetails = '';

        if (fileName.toLowerCase().endsWith('.xapk')) {
            showProgress(30, 'Đang phân tích XAPK...');
            
            // Find split packages ending in .apk
            const apkFiles = Object.keys(zip.files).filter(name => name.endsWith('.apk'));
            if (apkFiles.length === 0) {
                throw new Error('Không tìm thấy file APK nào bên trong XAPK!');
            }

            // Try to extract packageName from XAPK manifest.json if present
            const manifestJsonEntry = zip.file('manifest.json');
            let packageNameFromXapk = '';
            if (manifestJsonEntry) {
                try {
                    const manifestJsonStr = await manifestJsonEntry.async('text');
                    const manifestJson = JSON.parse(manifestJsonStr);
                    packageNameFromXapk = manifestJson.package_name || '';
                } catch (e) {
                    console.warn('Failed to parse XAPK manifest.json', e);
                }
            }

            // Heuristic 1: If we have package name, find ${packageName}.apk or base.apk
            let mainApkName = '';
            if (packageNameFromXapk) {
                mainApkName = apkFiles.find(name => 
                    name.toLowerCase() === 'base.apk' || 
                    name.toLowerCase() === `${packageNameFromXapk.toLowerCase()}.apk`
                );
            }

            // Heuristic 2: Filter out configuration split APKs (starting with config. or split_)
            if (!mainApkName) {
                let baseApkCandidates = apkFiles.filter(name => {
                    const lowerName = name.toLowerCase();
                    return !lowerName.startsWith('config.') && !lowerName.startsWith('split_');
                });
                
                // Fallback to all files if candidates are empty
                if (baseApkCandidates.length === 0) {
                    baseApkCandidates = apkFiles;
                }

                // Find base.apk, or the largest candidate APK
                mainApkName = baseApkCandidates.find(name => name.toLowerCase() === 'base.apk');
                if (!mainApkName) {
                    let largestSize = 0;
                    for (const name of baseApkCandidates) {
                        const entry = zip.files[name];
                        const size = entry._data ? (entry._data.uncompressedSize || 0) : 0;
                        if (size > largestSize) {
                            largestSize = size;
                            mainApkName = name;
                        }
                    }
                }
            }

            apkName = mainApkName || apkFiles[0];
            xapkDetails = `XAPK chứa ${apkFiles.length} file splits. Đang giải nén: ${apkName}`;
            
            showProgress(45, `Đang giải nén APK: ${apkName}...`);
            const apkEntry = zip.file(apkName);
            apkBuffer = await apkEntry.async('arraybuffer');
        }

        // Now process the target APK buffer
        showProgress(60, 'Đang phân tích APK...');
        const apkZip = await JSZip.loadAsync(apkBuffer);
        const manifestEntry = apkZip.file('AndroidManifest.xml');

        if (!manifestEntry) {
            throw new Error('Không tìm thấy AndroidManifest.xml trong file APK!');
        }

        showProgress(75, 'Đang giải mã AndroidManifest binary...');
        const manifestBuffer = await manifestEntry.async('arraybuffer');
        const parser = new APKParser.AXMLParser(manifestBuffer);
        const manifestTree = parser.parse();

        if (!manifestTree) {
            throw new Error('Giải mã AndroidManifest.xml thất bại!');
        }

        showProgress(90, 'Đang nén dữ liệu và trích xuất deep links...');
        
        // Helper to filter out binary resource reference IDs (integers/hex) from app labels
        const cleanAppLabel = (val) => {
            if (!val && val !== 0) return '';
            if (typeof val === 'number') return ''; // Skip numerical resource ID refs
            const s = String(val).trim();
            if (s.startsWith('0x') || /^\d+$/.test(s)) return ''; // Skip hex/decimal resource IDs
            return s;
        };

        // Extract basic metadata, explicitly cast as strings to prevent number exceptions
        State.packageName = String(manifestTree.attribs?.package || 'unknown.package');
        State.versionName = String(manifestTree.attribs?.versionName || '1.0');
        State.versionCode = String(manifestTree.attribs?.versionCode || '1');

        const sdkNode = APKParser.findFirst(manifestTree, 'uses-sdk');
        if (sdkNode) {
            State.minSdk = parseInt(sdkNode.attribs?.minSdkVersion) || null;
            State.targetSdk = parseInt(sdkNode.attribs?.targetSdkVersion) || null;
        }

        const appNode = APKParser.findFirst(manifestTree, 'application');
        if (appNode) {
            State.appLabel = cleanAppLabel(appNode.attribs?.label);
        }

        // Render full XML strings
        State.manifestStr = '<?xml version="1.0" encoding="utf-8"?>\n' + APKParser.xmlToStr(manifestTree);

        // Extract deep links
        State.deepLinks = APKParser.extractDeepLinks(manifestTree);

        // Extract full components for the components tab
        extractAllComponents(appNode);

        // Complete!
        showProgress(100, 'Hoàn thành!');
        
        setTimeout(() => {
            hideProgress();
            renderDashboard(xapkDetails);
        }, 300);
    }

    function extractAllComponents(appNode) {
        State.components = [];
        if (!appNode) return;

        const truthy = v => v === 'true' || v === true;

        const collectComponents = (tag, type) => {
            APKParser.findAll(appNode, tag).forEach(e => {
                const exportedAttr = e.attribs?.exported;
                const filters = (e.children || []).filter(c => c.tag === 'intent-filter');
                const exported = truthy(exportedAttr) || (exportedAttr === undefined && filters.length > 0);

                State.components.push({
                    type,
                    name: e.attribs?.name || '',
                    exported
                });
            });
        };

        collectComponents('activity', 'activity');
        collectComponents('activity-alias', 'activity');
        collectComponents('service', 'service');
        collectComponents('receiver', 'receiver');
        collectComponents('provider', 'provider');
    }

    // UI Render Dashboard
    function renderDashboard(xapkDetails) {
        $('#landingSection').style.display = 'none';
        $('#dashboardSection').classList.add('active');

        // Render App Identity
        const labelOrPackage = String(State.appLabel || State.packageName || '?');
        const letter = labelOrPackage.charAt(0).toUpperCase();
        $('#appLogoBox').innerHTML = `<span aria-hidden="true">${APKParser.esc(letter)}</span>`;
        $('#appLabel').textContent = State.appLabel || State.packageName || 'Unknown App';
        $('#appPackage').textContent = State.packageName;

        // Populate metadata rows
        $('#sidebarFileName').textContent = State.fileName;
        $('#sidebarFileSize').textContent = formatBytes(State.fileSize);
        $('#sidebarPkgType').textContent = State.packageType;
        
        const mainDetails = $('#sidebarXapkDetails');
        if (xapkDetails) {
            mainDetails.textContent = xapkDetails;
            mainDetails.parentElement.style.display = 'flex';
        } else {
            mainDetails.parentElement.style.display = 'none';
        }

        $('#sidebarVerName').textContent = State.versionName;
        $('#sidebarVerCode').textContent = `Code: ${State.versionCode}`;
        $('#sidebarMinSdk').textContent = State.minSdk ? `${State.minSdk} (${getAndroidVerName(State.minSdk)})` : '-';
        $('#sidebarTargetSdk').textContent = State.targetSdk ? `${State.targetSdk} (${getAndroidVerName(State.targetSdk)})` : '-';
        
        // Hashes
        $('#sidebarSha256').textContent = State.sha256 || 'Đang tính toán...';
        $('#sidebarSha256').title = State.sha256 || 'Calculated SHA-256';
        
        const md5El = $('#sidebarMd5');
        if (md5El) {
            md5El.textContent = State.md5 || 'Đang tính toán...';
        }

        // Add copy event to hash
        $('#sidebarSha256').onclick = () => {
            if (State.sha256) copyTextToClipboard(State.sha256, 'SHA-256');
        };

        // Render metrics counts
        const appLinksCount = State.deepLinks.filter(d => d.schemes.includes('http') || d.schemes.includes('https')).length;
        const customCount = State.deepLinks.length - appLinksCount;

        $('#metricDeepLinks').textContent = State.deepLinks.length;
        $('#metricAppLinks').textContent = appLinksCount;
        $('#metricCustomCount').textContent = customCount;
        $('#metricComponents').textContent = State.components.length;

        // Render content panels
        renderDeepLinksList();
        renderXmlManifest();
        renderComponentsList();

        // Switch to the first tab
        switchTab('deeplinks');
    }

    function renderDeepLinksList() {
        const listContainer = $('#deeplinksList');
        
        // Sync filterType with DOM element value to prevent browser autofill/cache mismatch
        if ($('#filterSelect')) {
            State.filterType = $('#filterSelect').value;
        }

        let filtered = State.deepLinks.slice();

        // 1. Filter by search query
        const q = State.searchQuery.trim().toLowerCase();
        if (q) {
            filtered = filtered.filter(dl => 
                dl.activity.toLowerCase().includes(q) ||
                dl.schemes.some(s => s.toLowerCase().includes(q)) ||
                dl.hosts.some(h => h.toLowerCase().includes(q)) ||
                dl.paths.some(p => p.value.toLowerCase().includes(q))
            );
        }

        // 2. Filter by tab selector type
        if (State.filterType === 'applinks') {
            filtered = filtered.filter(dl => dl.schemes.includes('http') || dl.schemes.includes('https'));
        } else if (State.filterType === 'custom') {
            filtered = filtered.filter(dl => !dl.schemes.includes('http') && !dl.schemes.includes('https'));
        }

        // Update count badge
        $('#deeplinkCountBadge').textContent = filtered.length;

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div class="no-data-state">
                    <span class="no-data-icon">🔗</span>
                    <h3>Không tìm thấy Deep Link nào</h3>
                    <p>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = filtered.map((dl, idx) => {
            const isWebLink = dl.schemes.includes('http') || dl.schemes.includes('https');
            const schemeType = isWebLink ? 'App Link' : 'Custom Scheme';
            const schemeClass = isWebLink ? 'applink' : 'custom';
            
            // Format activity name
            const shortActivity = dl.activity.split('.').pop();

            // Construct preview deep link
            const firstScheme = dl.schemes[0] || 'myapp';
            const firstHost = dl.hosts[0] || '';
            let pathVal = '';
            if (dl.paths.length > 0) {
                pathVal = dl.paths[0].value;
                if (dl.paths[0].type === 'prefix' && !pathVal.endsWith('/')) {
                    // Just a visual preview
                }
            }
            const previewUrl = `${firstScheme}://${firstHost}${pathVal}`;

            // Generate ADB command
            const adbCmd = `adb shell am start -W -a android.intent.action.VIEW -d "${previewUrl}" ${State.packageName}`;

            return `
                <div class="deeplink-card" id="dl-card-${idx}">
                    <div class="card-header">
                        <div class="card-header-main">
                            <span class="card-activity" title="${dl.activity}">${shortActivity}</span>
                            <h3 class="card-title">${previewUrl}</h3>
                        </div>
                        <div class="card-badges">
                            <span class="tag-badge ${schemeClass}">${schemeType}</span>
                            <span class="tag-badge ${dl.isBrowsable ? 'browsable' : 'non-browsable'}">
                                ${dl.isBrowsable ? 'browsable' : 'non-browsable'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="card-body">
                        <div class="filter-details">
                            <div class="details-row">
                                <span class="details-lbl">Schemes</span>
                                <div class="details-val">
                                    ${dl.schemes.map(s => `<span class="pill-tag scheme">${s}</span>`).join('')}
                                </div>
                            </div>
                            ${dl.hosts.length > 0 ? `
                            <div class="details-row">
                                <span class="details-lbl">Hosts</span>
                                <div class="details-val">
                                    ${dl.hosts.map(h => `<span class="pill-tag host">${h}</span>`).join('')}
                                </div>
                            </div>` : ''}
                            ${dl.ports.length > 0 ? `
                            <div class="details-row">
                                <span class="details-lbl">Ports</span>
                                <div class="details-val">
                                    ${dl.ports.map(p => `<span class="pill-tag">${p}</span>`).join('')}
                                </div>
                            </div>` : ''}
                            ${dl.paths.length > 0 ? `
                            <div class="details-row">
                                <span class="details-lbl">Paths</span>
                                <div class="details-val">
                                    ${dl.paths.map(p => `<span class="pill-tag path" title="Type: ${p.type}">${p.type}: ${p.value}</span>`).join('')}
                                </div>
                            </div>` : ''}
                        </div>

                        <div class="adb-command-box">
                            <span class="adb-lbl">ADB CMD</span>
                            <div class="adb-cmd">${APKParser.esc(adbCmd)}</div>
                            <div class="card-actions-wrap" style="padding: 0 1rem">
                                <button class="icon-btn" onclick="APKParser.copyAdbCommand(this, '${APKParser.esc(adbCmd).replace(/'/g, "\\'")}')" title="Sao chép câu lệnh ADB">
                                    📋
                                </button>
                                <button class="icon-btn" onclick="APKParser.showQrModal(this, '${previewUrl}')" title="Hiển thị mã QR để quét">
                                    📱
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderXmlManifest() {
        const rawView = $('#manifestXmlRaw');
        if (State.manifestStr) {
            rawView.textContent = State.manifestStr;
        } else {
            rawView.textContent = 'AndroidManifest.xml not loaded.';
        }
    }

    function renderComponentsList() {
        const container = $('#componentsList');
        $('#componentsCountBadge').textContent = State.components.length;

        if (State.components.length === 0) {
            container.innerHTML = '<div class="no-data-state">Chưa có component nào được tải</div>';
            return;
        }

        container.innerHTML = State.components.map(cmp => {
            const shortName = cmp.name.split('.').pop() || cmp.name;
            return `
                <div class="comp-row">
                    <div class="comp-details-left">
                        <span class="comp-type-chip ${cmp.type}">${cmp.type}</span>
                        <span class="comp-name-txt" title="${cmp.name}">${shortName}</span>
                    </div>
                    <div class="comp-badges-right">
                        <span class="tag-badge ${cmp.exported ? 'browsable' : 'non-browsable'}">
                            ${cmp.exported ? 'exported' : 'private'}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function switchTab(tabName) {
        State.activeTab = tabName;

        // Update active nav button
        $$('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Show active panel
        $$('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `tabpanel-${tabName}`);
        });

        // Trigger focus if tester
        if (tabName === 'tester') {
            $('#testUrlInput').focus();
        }
    }

    // Dynamic Deep Link Tester Logic
    function runDeepLinkTester() {
        const inputUrl = $('#testUrlInput').value.trim();
        const alertBox = $('#testResultAlert');

        if (!inputUrl) {
            alertBox.style.display = 'none';
            // Reset any highlighted cards
            $$('.deeplink-card').forEach(card => card.classList.remove('highlight'));
            return;
        }

        const matchResult = APKParser.matchDeepLink(inputUrl, State.deepLinks);
        
        // Remove previous highlights
        $$('.deeplink-card').forEach(card => card.classList.remove('highlight'));

        if (matchResult.matched) {
            alertBox.style.display = 'flex';
            alertBox.className = 'test-result-alert match';
            alertBox.innerHTML = `
                <span class="icon-badge">✅</span>
                <div>
                    <strong>KHỚP HOÀN TOÀN!</strong><br>
                    Tìm thấy ${matchResult.matches.length} Intent Filter có cấu hình phù hợp với URL này.
                </div>
            `;

            // Highlight and scroll to matched card (first match)
            matchResult.matches.forEach(matchedLink => {
                // Find matching index in State.deepLinks
                const idx = State.deepLinks.findIndex(dl => 
                    dl.activity === matchedLink.activity && 
                    JSON.stringify(dl.schemes) === JSON.stringify(matchedLink.schemes)
                );

                if (idx !== -1) {
                    const matchedCard = $(`#dl-card-${idx}`);
                    if (matchedCard) {
                        matchedCard.classList.add('highlight');
                    }
                }
            });

            // Automatically switch back to deep links list and scroll to matched
            const firstMatchedIdx = State.deepLinks.findIndex(dl => 
                dl.activity === matchResult.matches[0].activity && 
                JSON.stringify(dl.schemes) === JSON.stringify(matchResult.matches[0].schemes)
            );
            if (firstMatchedIdx !== -1) {
                setTimeout(() => {
                    switchTab('deeplinks');
                    const card = $(`#dl-card-${firstMatchedIdx}`);
                    if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 1000);
            }

        } else {
            alertBox.style.display = 'flex';
            alertBox.className = 'test-result-alert no-match';
            
            let reason = 'Không tìm thấy intent-filter nào phù hợp với URL đã nhập.';
            if (matchResult.reason) {
                reason = matchResult.reason;
            }

            alertBox.innerHTML = `
                <span class="icon-badge">❌</span>
                <div>
                    <strong>KHÔNG KHỚP!</strong><br>
                    ${reason}
                </div>
            `;
        }
    }

    // Modal Helpers
    APKParser.showQrModal = function (btn, url) {
        const overlay = $('#qrModalOverlay');
        const qrCanvas = $('#qrCanvas');
        
        $('#qrModalLink').textContent = url;
        
        // Generate QR code client side
        if (typeof QRious !== 'undefined') {
            new QRious({
                element: qrCanvas,
                value: url,
                size: 200,
                background: '#ffffff',
                foreground: '#060913',
                level: 'H'
            });
        } else {
            qrCanvas.parentElement.innerHTML = '<span style="color:#ff4757">Lỗi: Thư viện tạo mã QR chưa được tải!</span>';
        }

        overlay.classList.add('active');
    };

    function hideQrModal() {
        $('#qrModalOverlay').classList.remove('active');
    }

    APKParser.copyAdbCommand = function (btn, cmd) {
        copyTextToClipboard(cmd, 'ADB Command');
        btn.classList.add('copied');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓';
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = originalText;
        }, 1500);
    };

    // Helper Utility functions
    async function copyTextToClipboard(text, label) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (e) {
            console.error('Copy failed:', e);
            alert(`Sao chép thất bại. Bạn vui lòng sao chép thủ công!`);
        }
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function getAndroidVerName(sdk) {
        const map = {
            14: 'Android 4.0', 15: 'Android 4.0.3', 16: 'Android 4.1', 17: 'Android 4.2',
            18: 'Android 4.3', 19: 'Android 4.4', 21: 'Android 5.0', 22: 'Android 5.1',
            23: 'Android 6.0', 24: 'Android 7.0', 25: 'Android 7.1', 26: 'Android 8.0',
            27: 'Android 8.1', 28: 'Android 9.0', 29: 'Android 10', 30: 'Android 11',
            31: 'Android 12', 32: 'Android 12L', 33: 'Android 13', 34: 'Android 14',
            35: 'Android 15'
        };
        return map[sdk] || `SDK ${sdk}`;
    }

    function showProgress(percent, text) {
        const overlay = $('#loadingOverlay');
        const textEl = $('#loadingProgressText');
        const subtextEl = $('#loadingSubtext');
        
        overlay.classList.add('active');
        textEl.textContent = `${percent}%`;
        subtextEl.textContent = text || 'Vui lòng chờ...';

        // Update SVG circular stroke offset
        const ring = $('#progressRingFill');
        if (ring) {
            const radius = ring.r.baseVal.value;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (percent / 100) * circumference;
            ring.style.strokeDashoffset = offset;
        }
    }

    function hideProgress() {
        $('#loadingOverlay').classList.remove('active');
    }

    // Crypto implementations for MD5 and SHA-256 without external packages
    async function sha256hex(buf) {
        const hash = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async function md5hex(buf) {
        const b = new Uint8Array(buf);
        let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
        const s = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
        const K = [0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391];
        const len = b.length, bitLen = len * 8;
        const padLen = len + 1 + ((56 - (len + 1) % 64 + 64) % 64) + 8;
        const pad = new Uint8Array(padLen);
        pad.set(b); pad[len] = 0x80;
        const dv = new DataView(pad.buffer);
        dv.setUint32(padLen - 8, bitLen >>> 0, true);
        dv.setUint32(padLen - 4, Math.floor(bitLen / 0x100000000), true);

        for (let i = 0; i < padLen; i += 64) {
            const M = [];
            for (let j = 0; j < 16; j++) M[j] = dv.getUint32(i + j * 4, true);
            let A = a0, B = b0, C = c0, D = d0;
            for (let j = 0; j < 64; j++) {
                let F, g;
                if (j < 16) { F = (B & C) | ((~B) & D); g = j; }
                else if (j < 32) { F = (D & B) | ((~D) & C); g = (5 * j + 1) % 16; }
                else if (j < 48) { F = B ^ C ^ D; g = (3 * j + 5) % 16; }
                else { F = C ^ (B | (~D)); g = (7 * j) % 16; }
                F = (F + A + K[j] + M[g]) >>> 0;
                A = D; D = C; C = B;
                B = (B + ((F << s[j]) | (F >>> (32 - s[j])))) >>> 0;
            }
            a0 = (a0 + A) >>> 0;
            b0 = (b0 + B) >>> 0;
            c0 = (c0 + C) >>> 0;
            d0 = (d0 + D) >>> 0;
        }

        const hex = v => [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff]
            .map(x => x.toString(16).padStart(2, '0')).join('');
        return hex(a0) + hex(b0) + hex(c0) + hex(d0);
    }

})();
