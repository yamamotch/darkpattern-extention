const button = document.getElementById("checkButton");
const status = document.getElementById("status");
const results = document.getElementById("results");

button.addEventListener("click", async () => {
    button.disabled = true;
    status.textContent = "ページを分析しています…";
    results.innerHTML = "";

    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        // 分析用スクリプトをページに読み込む
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
        });

        // ページ内の分析関数を実行
        const execution = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                if (typeof window.__darkPatternAnalyze !== "function") {
                    return { findings: [], pageTitle: document.title, error: "分析処理を読み込めませんでした。" };
                }
                return window.__darkPatternAnalyze();
            }
        });

        const data = execution?.[0]?.result;
        if (!data) throw new Error("分析結果を取得できませんでした。");

        renderResults(data);
        status.textContent = `${data.findings.length}件の可能性を検出しました`;
    } catch (error) {
        status.textContent = "チェックできませんでした";
        results.innerHTML = `<p class="empty">${escapeHtml(error.message || "エラーが発生しました。")}</p>`;
    } finally {
        button.disabled = false;
    }
});

function renderResults(data) {
    if (data.error) {
        results.innerHTML = `<p class="empty">${escapeHtml(data.error)}</p>`;
        return;
    }

    if (!data.findings.length) {
        results.innerHTML = `<p class="empty">今回のルールでは、該当する表示は見つかりませんでした。</p>`;
        return;
    }

    results.innerHTML =
        `<p class="count">検出結果：${data.findings.length}件</p>` +
        data.findings.map(item => `
      <article class="result">
        <h2>${escapeHtml(item.category)}</h2>
        <p>${escapeHtml(item.reason)}</p>
        <p class="evidence">検出内容：${escapeHtml(item.evidence)}</p>
      </article>
    `).join("");
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
}
