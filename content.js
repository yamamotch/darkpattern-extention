(() => {
    // 同じページで何度実行しても分析関数を上書きするだけにする
    window.__darkPatternAnalyze = function () {
        const findings = [];
        const bodyText = document.body?.innerText || "";
        const normalizedText = bodyText.replace(/\s+/g, " ");
        const add = (category, reason, evidence) => {
            const key = `${category}:${evidence}`;
            if (!findings.some(item => item.key === key)) {
                findings.push({ key, category, reason, evidence });
            }
        };

        // 1. 緊急性：デモサイトのカウントダウン表示
        const countdown = document.querySelector("#countdown, .countdown-time, [class*='countdown']");
        if (countdown && countdown.textContent.trim()) {
            const title = document.querySelector(".countdown-title")?.textContent.trim() || "カウントダウン表示";
            add(
                "緊急性をあおる表示",
                "時間制限によって、利用者に購入を急がせている可能性があります。",
                `${title}：${countdown.textContent.trim()}`
            );
        } else if (/あと\s*\d+\s*[分秒]|残り時間|終了まで\s*\d+/.test(normalizedText)) {
            const match = normalizedText.match(/(?:あと\s*\d+\s*[分秒]|残り時間|終了まで\s*\d+)/);
            add("緊急性をあおる表示", "期限を強調して行動を急がせている可能性があります。", match?.[0] || "時間制限の表現");
        }

        // 2. 希少性：在庫の少なさを強調する表示
        const stockWarning = document.querySelector(".stock-warnig, .stock-warning, [class*='stock-warn']");
        const stockMatch = normalizedText.match(/残り\s*(?:あと\s*)?\d+\s*(?:室|点|部屋|件)|残室\s*\d+\s*(?:室)?|残りわずか/);
        if (stockWarning || stockMatch) {
            const evidence = stockMatch?.[0] ||
                stockWarning.textContent.trim().replace(/\s+/g, " ");
            add(
                "希少性を強調する表示",
                "在庫が少ないことを強調し、購入を促している可能性があります。",
                evidence.slice(0, 120)
            );
        }

        // 3. 購入を急かす表現・社会的証明
        const pressurePatterns = [
            { re: /今すぐ購入しないと売り切れるかもしれません！?/, category: "購入を急かす表現", reason: "売り切れへの不安を利用して、購入を急がせている可能性があります。" },
            { re: /お早めにお買い求めください!?/, category: "購入を急かす表現", reason: "急いで購入するよう促す表現が使われています。" },
            { re: /多くのお客様が購入を検討しています!?/, category: "社会的証明による誘導", reason: "他の利用者の関心を示して、購入を後押ししている可能性があります。" },
            { re: /今が購入のチャンスです!?/, category: "購入を急かす表現", reason: "今買うべきだと感じさせる表現が使われています。" }
        ];
        for (const pattern of pressurePatterns) {
            const match = normalizedText.match(pattern.re);
            if (match) add(pattern.category, pattern.reason, match[0]);
        }

        // 4. 割引表示：元価格と割引率の同時表示を検出
        const originalPrice = document.querySelector(".original-price");
        const discount = document.querySelector(".discount");
        if (originalPrice && discount) {
            add(
                "割引・価格表示の確認",
                "元価格と割引率が同時に表示されています。元価格が適正かどうかは、別途価格履歴などとの比較が必要です。",
                `${originalPrice.textContent.trim().replace(/\s+/g, " ")} / ${discount.textContent.trim()}`
            );
        }

        // 5. 送料の非表示：デモサイトのカート画面での確認
        const isCartPage = /cart/i.test(location.pathname) || document.querySelector("#cart-items");
        const shippingInfo = document.querySelector("#shipping-info");
        const darkMode = document.body.classList.contains("dark-mode");
        if (isCartPage && shippingInfo && (shippingInfo.hidden || getComputedStyle(shippingInfo).display === "none") && darkMode) {
            add(
                "追加料金の非表示",
                "カート画面で送料の表示が隠されています。購入前に最終的な支払総額を確認してください。",
                "送料の表示欄が非表示になっています"
            );
        }

        // デモサイトのモード情報は、実験結果の照合用として表示する
        const mode = darkMode ? "ダークパターン版" : "通常版";
        return {
            pageTitle: document.title,
            mode,
            findings: findings.map(({ key, ...item }) => item)
        };
    };
})();
