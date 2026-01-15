document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，初始化打字游戏...');

    // DOM元素
    // 文章选择相关
    const categorySelect = document.getElementById('category-select');
    const refreshArticlesBtn = document.getElementById('refresh-articles-btn');
    const articleList = document.getElementById('article-list');
    const articleCount = document.getElementById('article-count');
    const totalChars = document.getElementById('total-chars');
    const customText = document.getElementById('custom-text');
    const charCount = document.getElementById('char-count');
    const useCustomBtn = document.getElementById('use-custom-btn');
    const selectedCategory = document.getElementById('selected-category');
    const selectedLength = document.getElementById('selected-length');
    const selectedPreview = document.getElementById('selected-preview');
    const randomBtn = document.getElementById('random-btn');
    const newArticleBtn = document.getElementById('new-article-btn');
    const currentCategory = document.getElementById('current-category');
    const textLength = document.getElementById('text-length');

    // 游戏控制相关
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const hintBtn = document.getElementById('hint-btn');
    const inputArea = document.getElementById('input-area');
    const targetText = document.getElementById('target-text');

    // 统计显示
    const progressElement = document.getElementById('progress');
    const errorsElement = document.getElementById('errors');
    const speedElement = document.getElementById('speed');
    const accuracyElement = document.getElementById('accuracy');
    const timerElement = document.getElementById('timer');

    // 结果相关
    const resultsElement = document.getElementById('results');
    const finalTimeElement = document.getElementById('final-time');
    const finalSpeedElement = document.getElementById('final-speed');
    const finalAccuracyElement = document.getElementById('final-accuracy');
    const finalErrorsElement = document.getElementById('final-errors');
    const finalCategory = document.getElementById('final-category');
    const playAgainBtn = document.getElementById('play-again-btn');
    const shareBtn = document.getElementById('share-btn');

    // 排行榜相关
    const leaderboardBody = document.getElementById('leaderboard-body');
    const refreshLeaderboardBtn = document.getElementById('refresh-leaderboard-btn');

    // 提示模态框
    const hintModal = document.getElementById('hint-modal');
    const closeModalBtn = document.querySelector('.close-modal');

    // 游戏状态
    let gameState = {
        gameId: null,
        startTime: null,
        timerInterval: null,
        currentTime: 0,
        isActive: false,
        selectedArticle: null,
        selectedCategory: '随机'
    };

    // 初始化
    console.log('加载文章分类和排行榜...');
    loadCategories();
    loadArticles();
    loadLeaderboard();

    // 更新字符计数
    updateCharCount();

    // 事件监听器 - 文章选择相关
    categorySelect.addEventListener('change', loadArticles);
    refreshArticlesBtn.addEventListener('click', loadArticles);
    customText.addEventListener('input', updateCharCount);
    useCustomBtn.addEventListener('click', useCustomArticle);
    randomBtn.addEventListener('click', selectRandomArticle);
    newArticleBtn.addEventListener('click', showArticleSelection);

    // 事件监听器 - 游戏控制相关
    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    hintBtn.addEventListener('click', showHintModal);
    inputArea.addEventListener('input', handleInput);

    inputArea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !gameState.isActive) {
            e.preventDefault();
            console.log('按Enter键开始游戏');
            startGame();
        }
    });

    // 事件监听器 - 结果相关
    playAgainBtn.addEventListener('click', startGame);
    shareBtn.addEventListener('click', shareResults);

    // 事件监听器 - 排行榜相关
    refreshLeaderboardBtn.addEventListener('click', loadLeaderboard);

    // 事件监听器 - 模态框
    closeModalBtn.addEventListener('click', closeHintModal);
    hintModal.addEventListener('click', function(e) {
        if (e.target === hintModal) {
            closeHintModal();
        }
    });

    // ========== 文章选择功能 ==========

    // 显示文章选择区域
    function showArticleSelection() {
        document.getElementById('article-selection').style.display = 'block';
        document.getElementById('results').classList.add('hidden');
        gameState.selectedArticle = null;
        updateSelectedArticleInfo();
    }

    // 加载文章分类
    async function loadCategories() {
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) throw new Error('加载分类失败');

            const data = await response.json();
            console.log('文章分类加载成功:', data.categories);
        } catch (error) {
            console.error('加载分类时出错:', error);
        }
    }

    // 加载文章列表
    async function loadArticles() {
        const category = categorySelect.value;
        articleList.innerHTML = '<div class="loading-articles"><i class="fas fa-spinner fa-spin"></i> 加载文章中...</div>';

        try {
            const url = category ? `/api/articles?category=${encodeURIComponent(category)}` : '/api/articles';
            const response = await fetch(url);

            if (!response.ok) throw new Error(`加载文章失败: ${response.status}`);

            const data = await response.json();
            renderArticles(data.articles || []);

            // 更新统计信息
            articleCount.textContent = data.total || 0;

            // 计算总字符数
            const total = (data.articles || []).reduce((sum, article) => sum + (article.length || 0), 0);
            totalChars.textContent = total;

        } catch (error) {
            console.error('加载文章时出错:', error);
            articleList.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
        }
    }

    // 渲染文章列表
    function renderArticles(articles) {
        if (!articles || articles.length === 0) {
            articleList.innerHTML = '<div class="no-articles">该分类下暂无文章</div>';
            return;
        }

        articleList.innerHTML = '';
        articles.forEach((article, index) => {
            const articleItem = document.createElement('div');
            articleItem.className = 'article-item';

            // 如果这篇文章是当前选中的，添加选中样式
            if (gameState.selectedArticle &&
                gameState.selectedArticle.text === article.text) {
                articleItem.classList.add('selected');
            }

            // 截取文章预览
            const preview = article.text.substring(0, 60);
            const ellipsis = article.text.length > 60 ? '...' : '';

            articleItem.innerHTML = `
                <div class="article-content">${preview}${ellipsis}</div>
                <div class="article-meta">
                    <span class="article-category">${article.category || categorySelect.value || '未分类'}</span>
                    <span class="article-length">${article.length || article.text.length} 字符</span>
                </div>
            `;

            // 添加点击事件
            articleItem.addEventListener('click', () => selectArticle(article));
            articleList.appendChild(articleItem);
        });
    }

    // 选择文章
    function selectArticle(article) {
        gameState.selectedArticle = article;
        gameState.selectedCategory = article.category || categorySelect.value || '自定义';

        // 更新UI
        updateSelectedArticleInfo();

        // 更新文章列表中的选中状态
        document.querySelectorAll('.article-item').forEach(item => {
            item.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');

        console.log('已选择文章:', article.text.substring(0, 50) + '...');
    }

    // 使用自定义文章
    function useCustomArticle() {
        const text = customText.value.trim();
        if (!text) {
            alert('请输入自定义文章内容');
            customText.focus();
            return;
        }

        if (text.length < 10) {
            alert('文章太短，至少需要10个字符');
            return;
        }

        gameState.selectedArticle = {
            text: text,
            length: text.length,
            category: '自定义'
        };
        gameState.selectedCategory = '自定义';

        updateSelectedArticleInfo();

        // 可选：保存到服务器
        saveCustomArticle(text);
    }

    // 保存自定义文章到服务器
    async function saveCustomArticle(text) {
        try {
            const response = await fetch('/api/custom_article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text, category: '自定义' })
            });

            if (response.ok) {
                console.log('自定义文章保存成功');
            }
        } catch (error) {
            console.error('保存自定义文章时出错:', error);
        }
    }

    // 选择随机文章
    async function selectRandomArticle() {
        try {
            const response = await fetch('/api/articles');
            if (!response.ok) throw new Error('加载文章失败');

            const data = await response.json();
            if (data.articles && data.articles.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.articles.length);
                selectArticle(data.articles[randomIndex]);
                alert('已随机选择一篇文章！');
            }
        } catch (error) {
            console.error('选择随机文章时出错:', error);
            alert('随机选择失败，请稍后重试');
        }
    }

    // 更新字符计数
    function updateCharCount() {
        const text = customText.value;
        charCount.textContent = text.length;
    }

    // 更新选择的文章信息
    function updateSelectedArticleInfo() {
        if (gameState.selectedArticle) {
            selectedCategory.textContent = gameState.selectedCategory;
            selectedLength.textContent = gameState.selectedArticle.length || gameState.selectedArticle.text.length;

            // 预览文本（最多显示100字符）
            const previewText = gameState.selectedArticle.text;
            selectedPreview.textContent = previewText.substring(0, 100) +
                (previewText.length > 100 ? '...' : '');

            // 更新当前分类显示
            currentCategory.querySelector('span').textContent = gameState.selectedCategory;
            textLength.textContent = gameState.selectedArticle.length || gameState.selectedArticle.text.length;
        } else {
            selectedCategory.textContent = '随机';
            selectedLength.textContent = '0';
            selectedPreview.textContent = '未选择文章，将使用随机文章';
            currentCategory.querySelector('span').textContent = '随机';
            textLength.textContent = '0';
        }
    }

    // ========== 游戏核心功能 ==========

    // 开始新游戏
    async function startGame() {
        console.log('开始新游戏...');

        try {
            // 显示加载状态
            startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 准备中...';
            startBtn.disabled = true;

            // 准备游戏数据
            const gameData = {};
            if (gameState.selectedArticle) {
                gameData.text = gameState.selectedArticle.text;
                gameData.category = gameState.selectedCategory;
            }

            console.log('发送游戏开始请求...');

            const response = await fetch('/api/start_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(gameData)
            });

            console.log('收到响应状态:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('服务器返回错误:', response.status, errorText);
                throw new Error(`服务器错误 (${response.status})`);
            }

            const data = await response.json();
            console.log('游戏开始成功:', data);

            // 更新游戏状态
            gameState.gameId = data.game_id;
            gameState.startTime = Date.now();
            gameState.isActive = true;

            // 更新UI
            targetText.textContent = data.text;
            inputArea.value = '';
            inputArea.disabled = false;
            inputArea.focus();

            // 更新分类和长度显示
            currentCategory.querySelector('span').textContent = data.category || gameState.selectedCategory;
            textLength.textContent = data.length || data.text.length;

            // 重置统计
            progressElement.textContent = '0%';
            errorsElement.textContent = '0';
            speedElement.textContent = '0';
            accuracyElement.textContent = '0%';
            timerElement.textContent = '0.00';

            // 隐藏结果和文章选择
            resultsElement.classList.add('hidden');
            document.getElementById('article-selection').style.display = 'none';

            // 启用/禁用按钮
            startBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-play"></i> 游戏进行中...';
            resetBtn.disabled = false;

            // 开始计时器
            startTimer();

            console.log('游戏开始成功，gameId:', gameState.gameId);

        } catch (error) {
            console.error('开始游戏时出错:', error);

            // 恢复按钮状态
            startBtn.disabled = false;
            startBtn.innerHTML = '<i class="fas fa-play"></i> 开始游戏';

            alert(`无法开始游戏: ${error.message}`);
        }
    }

    // 重置游戏
    function resetGame() {
        if (!gameState.isActive) return;

        console.log('重置游戏');

        // 重置游戏状态
        gameState.isActive = false;
        clearInterval(gameState.timerInterval);

        // 重置UI
        inputArea.value = '';
        inputArea.disabled = true;

        // 重置统计
        progressElement.textContent = '0%';
        errorsElement.textContent = '0';
        speedElement.textContent = '0';
        accuracyElement.textContent = '0%';
        timerElement.textContent = '0.00';

        // 隐藏结果
        resultsElement.classList.add('hidden');

        // 启用/禁用按钮
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="fas fa-play"></i> 开始新游戏';
        resetBtn.disabled = true;

        targetText.textContent = '请选择文章后点击"开始游戏"按钮';
        currentCategory.querySelector('span').textContent = '未开始';
        textLength.textContent = '0';
    }

    // 处理输入
    async function handleInput() {
        if (!gameState.isActive) return;

        const typedText = inputArea.value;

        try {
            const response = await fetch('/api/check_progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    game_id: gameState.gameId,
                    typed_text: typedText
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`服务器错误 (${response.status})`);
            }

            const data = await response.json();

            // 更新进度
            if (data.completed) {
                console.log('游戏完成!', data);
                finishGame(data);
            } else {
                updateProgress(data);
            }

            // 高亮显示文本
            highlightText(typedText);

        } catch (error) {
            console.error('检查进度时出错:', error);
        }
    }

    // 更新进度显示
    function updateProgress(data) {
        progressElement.textContent = `${data.progress}%`;
        errorsElement.textContent = data.errors;

        // 计算实时速度
        if (gameState.currentTime > 0) {
            const charsPerMinute = (data.typed_length / gameState.currentTime) * 60;
            speedElement.textContent = Math.round(charsPerMinute);

            // 计算实时准确率
            if (data.typed_length > 0) {
                const accuracy = ((data.typed_length - data.errors) / data.typed_length) * 100;
                accuracyElement.textContent = `${Math.round(accuracy)}%`;
            }
        }
    }

    // 完成游戏
    function finishGame(data) {
        console.log('游戏完成，显示结果');

        // 停止计时器
        clearInterval(gameState.timerInterval);
        gameState.isActive = false;

        // 更新最终结果
        finalTimeElement.textContent = `${data.elapsed_time} 秒`;
        finalSpeedElement.textContent = `${data.chars_per_minute} 字/分钟`;
        finalAccuracyElement.textContent = `${data.accuracy}%`;
        finalErrorsElement.textContent = data.errors;

        if (finalCategory) {
            finalCategory.textContent = data.category || gameState.selectedCategory || '随机';
        }

        // 显示结果
        resultsElement.classList.remove('hidden');

        // 启用/禁用按钮
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="fas fa-play"></i> 开始新游戏';
        resetBtn.disabled = true;
        inputArea.disabled = true;

        // 加载更新的排行榜
        loadLeaderboard();
    }

    // 开始计时器
    function startTimer() {
        clearInterval(gameState.timerInterval);
        gameState.currentTime = 0;

        gameState.timerInterval = setInterval(() => {
            gameState.currentTime += 0.1;
            timerElement.textContent = gameState.currentTime.toFixed(2);
        }, 100);
    }

    // 高亮显示文本
    function highlightText(typedText) {
        const originalText = targetText.textContent;
        let highlightedHTML = '';

        for (let i = 0; i < originalText.length; i++) {
            let char = originalText[i];

            if (i < typedText.length) {
                if (typedText[i] === char) {
                    // 正确字符 - 绿色
                    highlightedHTML += `<span class="correct">${char}</span>`;
                } else {
                    // 错误字符 - 红色
                    highlightedHTML += `<span class="incorrect">${char}</span>`;
                }
            } else if (i === typedText.length) {
                // 下一个要输入的字符 - 黄色下划线
                highlightedHTML += `<span class="next">${char}</span>`;
            } else {
                // 尚未输入字符 - 默认颜色
                highlightedHTML += char;
            }
        }

        targetText.innerHTML = highlightedHTML;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .correct { color: #2ecc71; font-weight: bold; }
            .incorrect { color: #e74c3c; background: rgba(231, 76, 60, 0.1); text-decoration: line-through; }
            .next { border-bottom: 2px solid #f39c12; background: rgba(243, 156, 18, 0.1); }
        `;

        // 移除旧样式并添加新样式
        const oldStyle = document.getElementById('highlight-styles');
        if (oldStyle) oldStyle.remove();

        style.id = 'highlight-styles';
        document.head.appendChild(style);
    }

    // ========== 分享功能 ==========

    // 分享结果 - 修复版
    function shareResults() {
        try {
            console.log('开始分享成绩...');

            // 获取结果数据
            const finalTime = finalTimeElement.textContent;
            const finalSpeed = finalSpeedElement.textContent;
            const finalAccuracy = finalAccuracyElement.textContent;

            // 获取分类信息
            let categoryInfo = '';
            if (finalCategory && finalCategory.textContent && finalCategory.textContent !== '随机') {
                categoryInfo = `（分类：${finalCategory.textContent}）`;
            }

            // 构建分享文本
            const shareText = `🎮 打字游戏成绩 🎮\n\n` +
                             `打字速度: ${finalSpeed}\n` +
                             `准确率: ${finalAccuracy}\n` +
                             `用时: ${finalTime}\n` +
                             `${categoryInfo}\n\n` +
                             `你也来挑战吧！\n` +
                             `游戏地址: ${window.location.href}`;

            console.log('分享文本:', shareText);

            // 保存按钮原始状态
            const originalHtml = shareBtn.innerHTML;

            // 显示加载状态
            shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 复制中...';
            shareBtn.disabled = true;

            // 复制到剪贴板
            navigator.clipboard.writeText(shareText).then(() => {
                // 成功
                console.log('复制成功');

                // 显示成功消息
                const successMessage = `✅ 成绩已复制到剪贴板！\n\n` +
                                     `📋 你可以粘贴到：\n` +
                                     `• 微信/QQ聊天\n` +
                                     `• 微博/朋友圈\n` +
                                     `• 任何支持文本的地方\n\n` +
                                     `📝 预览：\n` +
                                     `${shareText.substring(0, 80)}...`;

                alert(successMessage);

                // 恢复按钮状态
                setTimeout(() => {
                    shareBtn.innerHTML = originalHtml;
                    shareBtn.disabled = false;
                }, 1500);

            }).catch(err => {
                console.error('复制失败:', err);

                // 使用备用方法
                const textArea = document.createElement('textarea');
                textArea.value = shareText;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();

                try {
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);

                    if (successful) {
                        alert('✅ 成绩已复制到剪贴板！');
                    } else {
                        throw new Error('复制命令失败');
                    }
                } catch (err2) {
                    console.error('备用方法也失败:', err2);

                    // 显示文本让用户手动复制
                    const fallbackMessage = `❌ 自动复制失败\n\n` +
                                          `请手动复制以下文本：\n\n` +
                                          `${shareText}\n\n` +
                                          `操作步骤：\n` +
                                          `1. 全选上面的文本 (Ctrl+A)\n` +
                                          `2. 复制 (Ctrl+C)\n` +
                                          `3. 粘贴到想要分享的地方`;

                    alert(fallbackMessage);
                }

                // 恢复按钮状态
                shareBtn.innerHTML = originalHtml;
                shareBtn.disabled = false;
            });

        } catch (error) {
            console.error('分享过程中出错:', error);

            // 恢复按钮状态
            shareBtn.disabled = false;
            shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> 分享成绩';

            // 显示简单错误信息
            alert('分享失败，请手动复制成绩信息');
        }
    }

    // ========== 排行榜功能 ==========

    // 加载排行榜
    async function loadLeaderboard() {
        console.log('加载排行榜数据...');

        try {
            const response = await fetch('/api/get_leaderboard');

            if (!response.ok) {
                throw new Error(`无法加载排行榜: ${response.status}`);
            }

            const leaderboard = await response.json();
            console.log('排行榜数据:', leaderboard);
            renderLeaderboard(leaderboard);

        } catch (error) {
            console.error('加载排行榜时出错:', error);
            // 显示错误消息
            leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #e74c3c;">
                        无法加载排行榜数据: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    // 渲染排行榜
    function renderLeaderboard(leaderboard) {
        leaderboardBody.innerHTML = '';

        leaderboard.forEach(player => {
            const row = document.createElement('tr');

            // 为前三名添加特殊样式
            let rankClass = '';
            if (player.rank === 1) rankClass = 'first';
            else if (player.rank === 2) rankClass = 'second';
            else if (player.rank === 3) rankClass = 'third';

            row.innerHTML = `
                <td class="${rankClass}">${player.rank}</td>
                <td>${player.name}</td>
                <td>${player.speed}</td>
                <td>${player.accuracy}%</td>
                <td>${player.category || '随机'}</td>
                <td>${player.date}</td>
            `;

            leaderboardBody.appendChild(row);
        });

        // 添加排行榜样式
        const style = document.createElement('style');
        style.textContent = `
            .first { color: #f1c40f !important; font-size: 1.2em; }
            .second { color: #bdc3c7 !important; font-size: 1.1em; }
            .third { color: #cd7f32 !important; font-size: 1.05em; }
        `;

        // 移除旧样式并添加新样式
        const oldStyle = document.getElementById('leaderboard-styles');
        if (oldStyle) oldStyle.remove();

        style.id = 'leaderboard-styles';
        document.head.appendChild(style);
    }

    // ========== 提示功能 ==========

    // 显示提示模态框
    function showHintModal() {
        hintModal.classList.remove('hidden');
    }

    // 关闭提示模态框
    function closeHintModal() {
        hintModal.classList.add('hidden');
    }

    // ========== 工具函数 ==========

    // 调整文本区域高度
    function adjustTextareaHeight() {
        inputArea.style.height = 'auto';
        inputArea.style.height = inputArea.scrollHeight + 'px';
    }

    // 添加输入区域高度调整
    inputArea.addEventListener('input', adjustTextareaHeight);

    console.log('打字游戏初始化完成，可以开始游戏！');
});
