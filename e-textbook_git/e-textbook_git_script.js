// JSONファイルを読み込んで画面を作る
async function loadGitData() {
    try {
        // 1. fetchを使って外部のdata.jsonを読み込む
        const response = await fetch('e-textbook_git_data.json');
        const gitData = await response.json();

        const sidebar = document.getElementById('sidebar');
        const content = document.getElementById('content');

        gitData.forEach((ch, chIdx) => {
            // --- 1. 目次（サイドバー）の生成 ---
            const navH3 = document.createElement('h3');
            const chapterId = `ch-${chIdx}`; // 章のジャンプ先ID

            // チャプター
            navH3.innerHTML = `<a href="#${chapterId}">${ch.chapter}</a>`;
            sidebar.appendChild(navH3);
            
            // 小見出し
            const navUl = document.createElement('ul');
            ch.items.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#${item.id}">${item.title}</a>`;
                navUl.appendChild(li);
            });
            sidebar.appendChild(navUl);

            // --- 2. 本文の生成 ---
            const h2 = document.createElement('h2');
            h2.id = chapterId; // 目次からのジャンプ先IDと一致させる
            h2.className = 'chapter-title';
            h2.textContent = ch.chapter;
            content.appendChild(h2);

            ch.items.forEach(item => {
                const section = document.createElement('div');
                section.className = 'command-section';
                section.innerHTML = `
                    <h3 id="${item.id}" class="command-title">${item.title}</h3>
                    <p>${item.desc}</p>
                    <div class="code-box">
                        <button class="copy-btn" onclick="copyText(this, '${item.id}-code')">コピー</button>
                        <pre><code id="${item.id}-code" class="language-bash">${item.cmd}</code></pre>
                    </div>
                    ${item.note ? `<div class="note"><strong>Memo:</strong> ${item.note}</div>` : ''}
                `;
                content.appendChild(section);
            });
        });

        // 読み込み後にPrism.jsを適用（ハイライトを当てる）
        Prism.highlightAll();

    } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
    }
}

// --- UI操作系 ---
// メニュー開閉
document.getElementById('menu-btn').onclick = () => sidebar.classList.toggle('open');
sidebar.onclick = (e) => { if(e.target.tagName === 'A') sidebar.classList.remove('open'); };

// コピー機能
function copyText(btn, codeId) {
    const txt = document.getElementById(codeId).textContent.trim();
    navigator.clipboard.writeText(txt).then(() => {
        const original = btn.textContent;
        btn.textContent = '完了';
        btn.classList.add('ok');
        setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove('ok');
        }, 1000);
    });
}
// 実行
loadGitData();