/**
 * parser.js
 * Core engine for parsing binary AndroidManifest.xml and matching deep links.
 * Works entirely client-side in the browser.
 */

(function (root) {
    'use strict';

    // HTML escape helper
    const esc = s => {
        if (!s && s !== 0) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };

    /**
     * AXMLParser decodes binary AndroidManifest.xml into a JavaScript object tree.
     * Ported from Sandeep Wawdane's apkauditor (compiled chunk-based Android binary XML specification).
     */
    class AXMLParser {
        constructor(buffer) {
            const ab = buffer instanceof ArrayBuffer ? buffer : buffer.buffer;
            this.v = new DataView(ab);
            this.b = new Uint8Array(ab);
            this.strings = [];
            this.stack = [];
            this.root = null;
            this.cur = null;
        }

        u16(o) { return this.v.getUint16(o, true); }
        u32(o) { return this.v.getUint32(o, true); }

        parseStringPool(off) {
            const headerSize = this.u16(off + 2) || 28;
            const cnt = this.u32(off + 8);
            const flags = this.u32(off + 16);
            const strStart = this.u32(off + 20);
            const isU8 = !!(flags & 0x100);
            const base = off + strStart;
            const dec = new TextDecoder('utf-8', { fatal: false });
            const dec16 = new TextDecoder('utf-16le', { fatal: false });

            for (let i = 0; i < cnt; i++) {
                const tableOff = off + headerSize + i * 4;
                if (tableOff + 4 > this.b.length) break;
                const so = base + this.u32(tableOff);
                if (so >= this.b.length) { this.strings.push(''); continue; }
                try {
                    if (isU8) {
                        let p = so;
                        let len = this.b[p++];
                        if (len & 0x80) len = ((len & 0x7F) << 8) | this.b[p++];
                        let len2 = this.b[p++];
                        if (len2 & 0x80) len2 = ((len2 & 0x7F) << 8) | this.b[p++];
                        const end = p + len2;
                        this.strings.push(dec.decode(this.b.slice(p, Math.min(end, this.b.length))));
                    } else {
                        let p = so;
                        let len = this.u16(p); p += 2;
                        if (len & 0x8000) { len = ((len & 0x7FFF) << 16) | this.u16(p); p += 2; }
                        const bytes = len * 2;
                        this.strings.push(dec16.decode(this.b.slice(p, Math.min(p + bytes, this.b.length))));
                    }
                } catch (e) {
                    this.strings.push('');
                }
            }
        }

        parseStartNs(off) { }

        parseStartElem(off) {
            if (off + 36 > this.b.length) return;
            const nameIdx = this.u32(off + 20);
            const attrStart = this.u16(off + 24);
            const attrSize = Math.max(this.u16(off + 26), 20);
            const attrCnt = this.u16(off + 28);
            const elem = { tag: this.strings[nameIdx] || '', attribs: {}, children: [] };
            const attrsBase = off + 16 + attrStart;

            for (let i = 0; i < attrCnt; i++) {
                const ao = attrsBase + i * attrSize;
                if (ao + 20 > this.b.length) break;
                const nm = this.u32(ao + 4);
                const rs = this.u32(ao + 8);
                const dt = ao + 15 < this.b.length ? this.b[ao + 15] : 0;
                const dv = this.u32(ao + 16);
                const key = this.strings[nm] || '';
                if (!key) continue;

                let val;
                switch (dt) {
                    case 0x03: val = (rs !== 0xFFFFFFFF && rs < this.strings.length) ? (this.strings[rs] ?? '') : ''; break;
                    case 0x10: val = dv | 0; break;
                    case 0x11: val = '0x' + (dv >>> 0).toString(16); break;
                    case 0x12: val = dv !== 0; break;
                    default: val = (rs !== 0xFFFFFFFF && rs < this.strings.length) ? (this.strings[rs] ?? dv) : dv;
                }
                elem.attribs[key] = val;
            }

            if (this.cur) {
                this.stack.push(this.cur);
                this.cur.children.push(elem);
            } else {
                this.root = elem;
            }
            this.cur = elem;
        }

        parseEndElem() {
            if (this.stack.length) this.cur = this.stack.pop();
        }

        parse() {
            try {
                if (this.b.length < 8) return null;
                if (this.u16(0) !== 0x0003) return null;
                let pos = 8;
                let iterations = 0;
                while (pos < this.b.length - 8 && iterations++ < 200000) {
                    if (pos + 8 > this.b.length) break;
                    const ct = this.u16(pos);
                    const cs = this.u32(pos + 4);
                    if (!cs || cs > this.b.length || pos + cs > this.b.length) break;
                    if (ct === 0x0001) this.parseStringPool(pos);
                    else if (ct === 0x0100) this.parseStartNs(pos);
                    else if (ct === 0x0102) this.parseStartElem(pos);
                    else if (ct === 0x0103) this.parseEndElem();
                    pos += cs;
                }
            } catch (e) {
                console.error('Binary AXML parser error:', e);
            }
            return this.root;
        }
    }

    // Helper functions for XML tree manipulation
    function findAll(node, tag) {
        if (!node) return [];
        const o = [];
        if (node.tag === tag) o.push(node);
        (node.children || []).forEach(c => o.push(...findAll(c, tag)));
        return o;
    }

    function findFirst(node, tag) {
        if (!node) return null;
        if (node.tag === tag) return node;
        for (const c of (node.children || [])) {
            const f = findFirst(c, tag);
            if (f) return f;
        }
        return null;
    }

    function xmlToStr(node, depth = 0) {
        if (!node) return '';
        const pad = '  '.repeat(depth);
        const attrs = Object.entries(node.attribs || {})
            .map(([k, v]) => ` ${k}="${esc(String(v))}"`)
            .join('');
        if (!node.children || !node.children.length) {
            return `${pad}<${node.tag}${attrs}/>`;
        }
        return `${pad}<${node.tag}${attrs}>\n${node.children.map(c => xmlToStr(c, depth + 1)).join('\n')}\n${pad}</${node.tag}>`;
    }

    /**
     * Parses the AndroidManifest.xml object tree and extracts all activities and their deep link intent-filters.
     */
    function extractDeepLinks(manifest) {
        const deepLinks = [];
        const app = findFirst(manifest, 'application');
        if (!app) return deepLinks;

        // Both activities and activity-aliases can hold deep links
        const activities = findAll(app, 'activity').concat(findAll(app, 'activity-alias'));

        for (const act of activities) {
            const actName = act.attribs?.name || '';
            const filters = (act.children || []).filter(c => c.tag === 'intent-filter');

            for (const filter of filters) {
                const actions = (filter.children || []).filter(c => c.tag === 'action').map(c => c.attribs?.name || '');
                const categories = (filter.children || []).filter(c => c.tag === 'category').map(c => c.attribs?.name || '');

                const isView = actions.includes('android.intent.action.VIEW');
                const isDefault = categories.includes('android.intent.category.DEFAULT');

                // A deep link filter MUST have action VIEW and category DEFAULT
                if (!isView || !isDefault) continue;

                const isBrowsable = categories.includes('android.intent.category.BROWSABLE');
                const dataTags = (filter.children || []).filter(c => c.tag === 'data').map(c => c.attribs || {});

                if (dataTags.length === 0) continue;

                // Android matches ANY combination of schemes, hosts, ports, and paths within a single filter.
                const schemes = [...new Set(dataTags.map(d => d.scheme || '').filter(Boolean))];
                const hosts = [...new Set(dataTags.map(d => d.host || '').filter(Boolean))];
                const ports = [...new Set(dataTags.map(d => d.port || '').filter(Boolean))];

                const paths = dataTags.map(d => {
                    if (d.path) return { type: 'literal', value: d.path };
                    if (d.pathPrefix) return { type: 'prefix', value: d.pathPrefix };
                    if (d.pathPattern) return { type: 'pattern', value: d.pathPattern };
                    if (d.pathAdvancedPattern) return { type: 'advanced', value: d.pathAdvancedPattern };
                    return null;
                }).filter(Boolean);

                if (schemes.length > 0) {
                    deepLinks.push({
                        activity: actName,
                        isBrowsable,
                        schemes,
                        hosts,
                        ports,
                        paths,
                        rawFilter: filter
                    });
                }
            }
        }
        return deepLinks;
    }

    /**
     * Translates an Android glob pattern into a JavaScript RegExp.
     * Rules:
     * - '.' matches any single character.
     * - '*' matches 0 or more occurrences of the PREVIOUS character.
     * - '.*' matches 0 or more occurrences of any character.
     * - '\' escapes characters in Android.
     */
    function matchAndroidPattern(path, androidPattern) {
        try {
            let regexStr = '^';
            for (let i = 0; i < androidPattern.length; i++) {
                const char = androidPattern[i];
                if (char === '\\') {
                    i++;
                    if (i < androidPattern.length) {
                        const next = androidPattern[i];
                        regexStr += '\\' + next;
                    }
                } else if (char === '.') {
                    regexStr += '.';
                } else if (char === '*') {
                    regexStr += '*';
                } else {
                    if ('+?^$()[]{}|'.includes(char)) {
                        regexStr += '\\' + char;
                    } else {
                        regexStr += char;
                    }
                }
            }
            regexStr += '$';
            const regex = new RegExp(regexStr);
            return regex.test(path);
        } catch (e) {
            console.error('Glob translation error:', e);
            return path === androidPattern;
        }
    }

    /**
     * Matches a test URL string against a list of extracted deep links.
     * Handles both web links (http/https) and custom schemes (myapp://).
     */
    function matchDeepLink(testUrlStr, deepLinks) {
        let testUrl;
        try {
            testUrl = new URL(testUrlStr);
        } catch (e) {
            // Fallback manual parser for custom schemes which may fail new URL() in older environments
            const match = testUrlStr.match(/^([^:]+):\/\/([^/]*)(.*)$/);
            if (match) {
                testUrl = {
                    protocol: match[1] + ':',
                    host: match[2],
                    hostname: match[2].split(':')[0],
                    port: match[2].split(':')[1] || '',
                    pathname: match[3] || '/'
                };
            } else {
                return { matched: false, reason: 'Invalid URL structure. Use scheme://host/path' };
            }
        }

        const testScheme = testUrl.protocol.replace(':', '');
        const testHost = testUrl.hostname || '';
        const testPort = testUrl.port || '';
        const testPath = testUrl.pathname || '/';

        const matches = [];

        for (const dl of deepLinks) {
            // 1. Validate scheme
            const schemeMatched = dl.schemes.includes(testScheme);
            if (!schemeMatched) continue;

            // 2. Validate host (optional for custom schemes, required if defined)
            let hostMatched = true;
            if (dl.hosts.length > 0) {
                hostMatched = dl.hosts.some(h => {
                    if (h === '*') return true;
                    if (h.startsWith('*.')) {
                        const suffix = h.slice(2);
                        return testHost === suffix || testHost.endsWith('.' + suffix);
                    }
                    return testHost === h;
                });
            }
            if (!hostMatched) continue;

            // 3. Validate port (optional, matches if matches any defined port)
            let portMatched = true;
            if (dl.ports.length > 0) {
                portMatched = dl.ports.includes(testPort);
            }
            if (!portMatched) continue;

            // 4. Validate path (matches if no path is defined or if matches any defined path pattern/prefix/literal)
            let pathMatched = true;
            if (dl.paths.length > 0) {
                pathMatched = dl.paths.some(p => {
                    if (p.type === 'literal') return testPath === p.value;
                    if (p.type === 'prefix') return testPath.startsWith(p.value);
                    if (p.type === 'pattern' || p.type === 'advanced') {
                        return matchAndroidPattern(testPath, p.value);
                    }
                    return false;
                });
            }

            if (pathMatched) {
                matches.push(dl);
            }
        }

        return {
            matched: matches.length > 0,
            matches: matches,
            urlInfo: {
                scheme: testScheme,
                host: testHost,
                port: testPort,
                path: testPath
            }
        };
    }

    // Export API
    const api = {
        AXMLParser,
        findAll,
        findFirst,
        xmlToStr,
        extractDeepLinks,
        matchAndroidPattern,
        matchDeepLink,
        esc
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    // Always expose to the global scope in browser environments
    const globalObj = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : root);
    if (globalObj) {
        globalObj.APKParser = api;
    }

})(typeof self !== 'undefined' ? self : this);
