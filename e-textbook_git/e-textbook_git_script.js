// // JSONファイルを読み込んで画面を作る
async function loadGitData() {
    try {
        const response = await fetch('e-textbook_git_data.json');
        const gitData = await response.json();

        const sidebar = document.getElementById('sidebar');
        const content = document.getElementById('content');

        gitData.forEach((ch, chIdx) => {
            // // --- 1. 目次（サイドバー）の生成 ---
            const navH3 = document.createElement('h3');
            const chapterId = `ch-${chIdx}`;

            navH3.innerHTML = `<a href="#${chapterId}">${ch.chapter}</a>`;
            sidebar.appendChild(navH3);
            
            const navUl = document.createElement('ul');
            ch.items.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#${item.id}">${item.title}</a>`;
                navUl.appendChild(li);
            });
            sidebar.appendChild(navUl);

            // // --- 2. 本文の生成 ---
            const h2 = document.createElement('h2');
            h2.id = chapterId;
            h2.className = 'chapter-title';
            h2.textContent = ch.chapter;
            content.appendChild(h2);

            // // --- 本文の生成部分の書き換え ---
ch.items.forEach(item => {
    const section = document.createElement('div');
    section.className = 'command-section';
    
    // // タイトルは固定で生成
    let innerHTML = `<h3 id="${item.id}" class="command-title">${item.title}</h3>`;

    // // JSONの content 配列を順番に見て、中身を組み立てる
    if (item.content) {
        item.content.forEach((part, pIdx) => {
            // // 説明文の場合
            if (part.type === "desc") {
                innerHTML += `<p>${part.val}</p>`;
            } 
            // // コマンドの場合
            else if (part.type === "cmd") {
                innerHTML += `
                    <div class="code-box">
                        <button class="copy-btn" onclick="copyText(this, '${item.id}-code-${pIdx}')">Copy</button>
                        <pre><code id="${item.id}-code-${pIdx}" class="language-bash">${part.val}</code></pre>
                    </div>`;
            } 
            // // テーブルの場合
            else if (part.type === "table") {
                let tableHtml = '<table><thead><tr>';
                part.val.headers.forEach(h => tableHtml += `<th>${h}</th>`);
                tableHtml += '</tr></thead><tbody>';
                part.val.rows.forEach(row => {
                    tableHtml += '<tr>';
                    row.forEach(cell => tableHtml += `<td>${cell}</td>`);
                    tableHtml += '</tr>';
                });
                tableHtml += '</tbody></table>';
                innerHTML += tableHtml;
            }
        });
    }

    // // Memoは最後に表示（これもcontentに含めてもOK）
    if (item.note) {
        innerHTML += `<div class="note"><strong>Memo:</strong> ${item.note}</div>`;
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
const sidebar = document.getElementById('sidebar'); // // 変数を定義
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