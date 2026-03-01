// // JSONファイルを読み込んで画面を作る
// // JSONファイルを読み込んで画面を作る
async function loadGitData() {
    try {
        const response = await fetch('e-textbook_git_data.json');
        const gitData = await response.json();

        const sidebar = document.getElementById('sidebar');
        const content = document.getElementById('content');

        gitData.forEach((ch, chIdx) => {
            // // --- 1. 目次の生成 ---
            const navH3 = document.createElement('h3');
            const chapterId = `ch-${chIdx}`;
            navH3.innerHTML = `<a href="#${chapterId}">${ch.chapter}</a>`;
            sidebar.appendChild(navH3);
            
            const navUl = document.createElement('ul');
            ch.items.forEach(item => {
                // // --- idを自動生成 ---
                // // タイトルが「初期化 (init)」なら idは「初期化 (init)」になる
                const autoId = item.title; 

                const li = document.createElement('li');
                li.innerHTML = `<a href="#${autoId}">${item.title}</a>`;
                navUl.appendChild(li);
            });
            sidebar.appendChild(navUl);

            // // --- 2. 本文の生成 ---
            const h2 = document.createElement('h2');
            h2.id = chapterId;
            h2.className = 'chapter-title';
            h2.textContent = ch.chapter;
            content.appendChild(h2);

            ch.items.forEach(item => {
                // // 本文側も同じルールでidを付ける
                const autoId = item.title;

                const section = document.createElement('div');
                section.className = 'command-section';
                
                // // id="${autoId}" を使うことでジャンプ先になる
                let innerHTML = `<h3 id="${autoId}" class="command-title">${item.title}</h3>`;

                // // 中身（content）のループ処理（スッキリ形式に対応）
                if (item.content) {
                    item.content.forEach((block, bIdx) => {
                        const type = Object.keys(block)[0];
                        const value = block[type];

                        if (type === "desc") {
                            innerHTML += `<p>${value}</p>`;
                        } else if (type === "cmd") {
                            // // コピー用IDも自動生成
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