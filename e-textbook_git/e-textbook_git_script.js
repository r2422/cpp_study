// // Markdownテキストを既存のデータ構造 (chapter/items/content/desc/cmd/table/note) に変換する
// //
// // 【書き方ルール】
// //   #  見出し   -> 章（chapter）
// //   ## 見出し   -> 項目（item）のタイトル
// //   通常の文章  -> 説明文（desc）。空行までを1つのdescとしてまとめ、改行はそのまま保持されます。
// //   ```〜```   -> コマンド（cmd）。中身はそのままコードとして表示されます。
// //   | a | b |  -> 表（table）。1行目が見出し、2行目に「|---|---|」のような区切り線が必要です。
// //   > 文章      -> 注意書き（note）。連続する「>」行は1つのnoteにまとめられます。
// //   ---（単独行）-> タイトルなしの項目を新しく開始する区切り線。
function parseMarkdown(mdText) {
    const lines = mdText.replace(/\r\n/g, '\n').split('\n');
    const data = [];
    let currentChapter = null;
    let currentItem = null;
    let i = 0;

    function pushItem() {
        if (currentItem) {
            const hasContent = currentItem.content && currentItem.content.length > 0;
            if (currentItem.title || hasContent || currentItem.note) {
                if (!currentItem.content) currentItem.content = [];
                currentChapter.items.push(currentItem);
            }
        }
        currentItem = null;
    }

    function ensureItem() {
        if (!currentChapter) {
            currentChapter = { chapter: '', items: [] };
            data.push(currentChapter);
        }
        if (!currentItem) {
            currentItem = { content: [] };
        }
    }

    function isTableSep(line) {
        return /^\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(line.trim()) && line.includes('-');
    }

    function splitRow(line) {
        let cells = line.trim();
        if (cells.startsWith('|')) cells = cells.slice(1);
        if (cells.endsWith('|')) cells = cells.slice(0, -1);
        return cells.split('|').map(c => c.trim());
    }

    while (i < lines.length) {
        const line = lines[i];

        // // 章見出し「# 」
        if (/^#\s+/.test(line)) {
            pushItem();
            currentChapter = { chapter: line.replace(/^#\s+/, '').trim(), items: [] };
            data.push(currentChapter);
            i++;
            continue;
        }

        // // 項目見出し「## 」
        if (/^##\s+/.test(line)) {
            pushItem();
            currentItem = { title: line.replace(/^##\s+/, '').trim(), content: [] };
            i++;
            continue;
        }

        // // タイトルなし項目の区切り線「---」単体行
        if (/^-{3,}\s*$/.test(line.trim())) {
            pushItem();
            i++;
            continue;
        }

        // // コードブロック ```
        if (/^```/.test(line)) {
            ensureItem();
            const codeLines = [];
            i++;
            while (i < lines.length && !/^```\s*$/.test(lines[i])) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // // 閉じ```を読み飛ばす
            currentItem.content.push({ cmd: codeLines.join('\n') });
            continue;
        }

        // // note（引用ブロック > ）※連続行は結合して1つのnoteに
        if (/^>\s?/.test(line)) {
            ensureItem();
            const noteLines = [];
            while (i < lines.length && /^>\s?/.test(lines[i])) {
                noteLines.push(lines[i].replace(/^>\s?/, ''));
                i++;
            }
            const joined = noteLines.join('\n');
            currentItem.note = currentItem.note ? currentItem.note + '\n' + joined : joined;
            continue;
        }

        // // テーブル（次の行が区切り線であること）
        if (/^\|/.test(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
            ensureItem();
            const headers = splitRow(line);
            i += 2; // // ヘッダー行と区切り行を読み飛ばす
            const rows = [];
            while (i < lines.length && /^\|/.test(lines[i])) {
                rows.push(splitRow(lines[i]));
                i++;
            }
            currentItem.content.push({ table: { headers, rows } });
            continue;
        }

        // // 空行はスキップ
        if (line.trim() === '') {
            i++;
            continue;
        }

        // // 通常の段落（空行 or 特殊行に当たるまで1つのdescとして結合、改行は保持）
        {
            ensureItem();
            const descLines = [line];
            i++;
            while (
                i < lines.length &&
                lines[i].trim() !== '' &&
                !/^#/.test(lines[i]) &&
                !/^```/.test(lines[i]) &&
                !/^>\s?/.test(lines[i]) &&
                !/^\|/.test(lines[i]) &&
                !/^-{3,}\s*$/.test(lines[i].trim())
            ) {
                descLines.push(lines[i]);
                i++;
            }
            currentItem.content.push({ desc: descLines.join('\n') });
        }
    }
    pushItem();
    return data;
}

// // Markdownファイルを読み込んで画面を作る
async function loadGitData() {
    try {
        const response = await fetch('e-textbook_git_data.md');
        const mdText = await response.text();
        const gitData = parseMarkdown(mdText);

        const sidebar = document.getElementById('sidebar');
        const content = document.getElementById('content');

        gitData.forEach((ch, chIdx) => {
            // // --- 1. 目次の生成 ---
            const navH3 = document.createElement('h3');
            const chapterId = `ch-${chIdx}`;
            navH3.innerHTML = `<a href="#${chapterId}">${ch.chapter}</a>`;
            sidebar.appendChild(navH3);
            
            const navUl = document.createElement('ul');
            ch.items.forEach((item, iIdx) => {
                // // タイトルがあればそれをidに、なければ「章-番号」で自動作成
                const autoId = item.title ? item.title : `temp-id-${chIdx}-${iIdx}`;

                // // タイトルが「ある」時だけ目次を作る
                if (item.title && item.title.trim() !== "") {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="#${autoId}">${item.title}</a>`;
                    navUl.appendChild(li);
                }
            });
            sidebar.appendChild(navUl);

            // // --- 2. 本文の生成 ---
            const h2 = document.createElement('h2');
            h2.id = chapterId;
            h2.className = 'chapter-title';
            h2.textContent = ch.chapter;
            content.appendChild(h2);

            // // --- 本文生成ループ内 (ch.items.forEach) ---
            ch.items.forEach((item, iIdx) => {
                // // --- 1. idの自動生成 ---
                const autoId = item.title ? item.title : `temp-id-${chIdx}-${iIdx}`;

                // // --- 2. 本文の生成 ---
                const section = document.createElement('div');
                section.className = 'command-section';
                
                let innerHTML = "";
                if (item.title) {
                    innerHTML += `<h3 id="${autoId}" class="command-title">${item.title}</h3>`;
                } else {
                    innerHTML += `<div id="${autoId}"></div>`;
                }

                if (item.content) {
                    item.content.forEach((block, bIdx) => {
                        const type = Object.keys(block)[0];
                        const value = block[type];

                        if (type === "desc") {
                            innerHTML += `<p>${value}</p>`;
                        } 
                        else if (type === "cmd") {
                            const codeId = `${autoId}-code-${bIdx}`;
                            innerHTML += `
                                <div class="code-box">
                                    <button class="copy-btn" onclick="copyText(this, '${codeId}')">Copy</button>
                                    <pre><code id="${codeId}" class="language-bash">${value}</code></pre>
                                </div>`;
                        } else if (type === "table") {
                            let tableHtml = '<table><thead><tr>';
                            value.headers.forEach(h => tableHtml += `<th>${h}</th>`);
                            tableHtml += '</tr></thead><tbody>';
                            value.rows.forEach(row => {
                                tableHtml += '<tr>';
                                row.forEach(cell => tableHtml += `<td>${cell}</td>`);
                                tableHtml += '</tr>';
                            });
                            tableHtml += '</tbody></table>';
                            innerHTML += tableHtml;
                        }
                    });
                }

                if (item.note) {
                    innerHTML += `<div class="note"> ${item.note}</div>`;
                }

                section.innerHTML = innerHTML;
                content.appendChild(section);
            });
        });

        Prism.highlightAll();

    } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
    }
}

// // --- UI操作系 ---
// // メニュー開閉
const sidebar = document.getElementById('sidebar');
document.getElementById('menu-btn').onclick = () => sidebar.classList.toggle('open');
sidebar.onclick = (e) => { if(e.target.tagName === 'A') sidebar.classList.remove('open'); };

// // コピー機能
function copyText(btn, codeId) {
    const txt = document.getElementById(codeId).textContent.trim();
    navigator.clipboard.writeText(txt).then(() => {
        const original = btn.textContent;
        btn.textContent = '✓ Copied';
        btn.classList.add('ok');
        setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove('ok');
        }, 1000);
    });
}
// // 実行
loadGitData();