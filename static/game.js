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
        selectedCategory: '随机',
        originalText: '',
        totalErrors: 0,
        typedLength: 0
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
    playAgainBtn.addEventListener('click', function() {
        resetGame();
        setTimeout(() => {
            if (gameState.selectedArticle) {
                startGame();
            } else {
                showArticleSelection();
            }
        }, 100);
    });
    
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
        resultsElement.style.display = 'none';
        resetGame();
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
            articleList.innerHTML = `<div class="error" style="text-align: center; padding: 20px; color: #ef4444;">加载失败: ${error.message}</div>`;
        }
    }

    // 渲染文章列表
    function renderArticles(articles) {
        if (!articles || articles.length === 0) {
            articleList.innerHTML = '<div class="no-articles" style="text-align: center; padding: 20px; color: #94a3b8;">该分类下暂无文章</div>';
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
            articleItem.addEventListener('click', function() {
                selectArticle(article);
            });
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
        
        // 给当前点击的文章添加选中样式
        const articleItems = document.querySelectorAll('.article-item');
        articleItems.forEach((item, index) => {
            const itemText = item.querySelector('.article-content').textContent;
            if (itemText.includes(article.text.substring(0, 50))) {
                item.classList.add('selected');
            }
        });

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

        // 检查是否已有游戏在进行
        if (gameState.isActive) {
            alert('游戏正在进行中，请先完成或重置当前游戏');
            return;
        }

        try {
            // 显示加载状态
            startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 准备中...';
            startBtn.disabled = true;
            resetBtn.disabled = true;

            let gameText;
            let gameCategory;

            if (gameState.selectedArticle) {
                gameText = gameState.selectedArticle.text;
                gameCategory = gameState.selectedCategory;
            } else {
                // 如果没有选择文章，使用随机文章
                try {
                    const response = await fetch('/api/articles');
                    if (!response.ok) throw new Error('加载随机文章失败');
                    const data = await response.json();
                    if (data.articles && data.articles.length > 0) {
                        const randomIndex = Math.floor(Math.random() * data.articles.length);
                        gameText = data.articles[randomIndex].text;
                        gameCategory = data.articles[randomIndex].category || '随机';
                    } else {
                        throw new Error('没有可用的文章');
                    }
                } catch (error) {
                    // 备用文本
                    gameText = '欢迎使用打字游戏！请在这里输入文本以开始练习。这是一个示例文本，用于测试打字速度和准确性。';
                    gameCategory = '示例';
                }
            }

            console.log('发送游戏开始请求...');

            const response = await fetch('/api/start_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    text: gameText,
                    category: gameCategory
                })
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
            gameState.gameId = data.game_id || Date.now().toString();
            gameState.startTime = Date.now();
            gameState.isActive = true;
            gameState.currentTime = 0;
            gameState.totalErrors = 0;
            gameState.typedLength = 0;
            gameState.originalText = gameText;

            // 更新UI
            targetText.textContent = gameText;
            targetText.innerHTML = gameText; // 清除可能的高亮
            inputArea.value = '';
            inputArea.disabled = false;
            inputArea.focus();

            // 更新分类和长度显示
            currentCategory.querySelector('span').textContent = gameCategory;
            textLength.textContent = gameText.length;

            // 重置统计
            progressElement.textContent = '0%';
            errorsElement.textContent = '0';
            speedElement.textContent = '0';
            accuracyElement.textContent = '0%';
            timerElement.textContent = '0.00';

            // 隐藏结果和文章选择
            resultsElement.classList.add('hidden');
            resultsElement.style.display = 'none';
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
            resetBtn.disabled = true;

            alert(`无法开始游戏: ${error.message}\n将使用本地模式进行游戏`);
            
            // 本地模式启动游戏
            startLocalGame();
        }
    }

    // 本地模式启动游戏（备用方案）
    function startLocalGame() {
        console.log('使用本地模式启动游戏');
        
        let gameText;
        let gameCategory;

        if (gameState.selectedArticle) {
            gameText = gameState.selectedArticle.text;
            gameCategory = gameState.selectedCategory;
        } else {
            gameText = '欢迎使用打字游戏！请在这里输入文本以开始练习。这是一个示例文本，用于测试打字速度和准确性。';
            gameCategory = '示例';
        }

        // 更新游戏状态
        gameState.gameId = Date.now().toString();
        gameState.startTime = Date.now();
        gameState.isActive = true;
        gameState.currentTime = 0;
        gameState.totalErrors = 0;
        gameState.typedLength = 0;
        gameState.originalText = gameText;

        // 更新UI
        targetText.textContent = gameText;
        targetText.innerHTML = gameText;
        inputArea.value = '';
        inputArea.disabled = false;
        inputArea.focus();

        // 更新分类和长度显示
        currentCategory.querySelector('span').textContent = gameCategory;
        textLength.textContent = gameText.length;

        // 重置统计
        progressElement.textContent = '0%';
        errorsElement.textContent = '0';
        speedElement.textContent = '0';
        accuracyElement.textContent = '0%';
        timerElement.textContent = '0.00';

        // 隐藏结果和文章选择
        resultsElement.classList.add('hidden');
        resultsElement.style.display = 'none';
        document.getElementById('article-selection').style.display = 'none';

        // 启用/禁用按钮
        startBtn.disabled = true;
        startBtn.innerHTML = '<i class="fas fa-play"></i> 游戏进行中...';
        resetBtn.disabled = false;

        // 开始计时器
        startTimer();
    }

    // 重置游戏
    function resetGame() {
        console.log('重置游戏');

        // 停止计时器
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }

        // 重置游戏状态
        gameState.isActive = false;
        gameState.currentTime = 0;
        gameState.totalErrors = 0;
        gameState.typedLength = 0;

        // 重置UI
        inputArea.value = '';
        inputArea.disabled = true;
        
        // 恢复目标文本为纯文本
        if (gameState.originalText) {
            targetText.textContent = gameState.originalText;
        } else {
            targetText.textContent = '请选择文章后点击"开始游戏"按钮';
        }

        // 重置统计
        progressElement.textContent = '0%';
        errorsElement.textContent = '0';
        speedElement.textContent = '0';
        accuracyElement.textContent = '0%';
        timerElement.textContent = '0.00';

        // 隐藏结果
        resultsElement.classList.add('hidden');
        resultsElement.style.display = 'none';

        // 恢复按钮状态
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="fas fa-play"></i> 开始游戏';
        resetBtn.disabled = true;

        // 更新分类和长度显示
        currentCategory.querySelector('span').textContent = gameState.selectedArticle ? gameState.selectedCategory : '未开始';
        textLength.textContent = gameState.selectedArticle ? (gameState.selectedArticle.length || gameState.selectedArticle.text.length) : '0';
    }

    // 处理输入
    async function handleInput() {
        if (!gameState.isActive) return;

        const typedText = inputArea.value;
        const originalText = gameState.originalText;

        // 更新已输入长度
        gameState.typedLength = typedText.length;

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

            if (response.ok) {
                const data = await response.json();
                
                // 更新游戏状态
                gameState.totalErrors = data.errors || gameState.totalErrors;
                
                // 检查是否完成
                if (data.completed || typedText.length >= originalText.length) {
                    console.log('游戏完成!', data);
                    finishGame(data);
                } else {
                    updateProgress(data);
                }
                
                // 高亮显示文本
                highlightText(typedText, originalText);
                
            } else {
                // 如果API失败，使用本地计算
                throw new Error('API请求失败');
            }

        } catch (error) {
            console.error('检查进度时出错，使用本地计算:', error);
            
            // 使用本地计算
            updateProgressLocally(typedText, originalText);
            highlightText(typedText, originalText);
            
            // 检查是否完成
            if (typedText.length >= originalText.length) {
                console.log('游戏完成（本地计算）');
                finishGameLocally(typedText, originalText);
            }
        }
    }

    // 本地更新进度（备用方案）
    function updateProgressLocally(typedText, originalText) {
        if (!originalText) return;
        
        const progress = Math.min(100, Math.round((typedText.length / originalText.length) * 100));
        
        // 计算错误数
        let errors = 0;
        const minLength = Math.min(typedText.length, originalText.length);
        
        for (let i = 0; i < minLength; i++) {
            if (typedText[i] !== originalText[i]) {
                errors++;
            }
        }
        
        // 如果输入的比目标长，额外的字符也算错误
        if (typedText.length > originalText.length) {
            errors += (typedText.length - originalText.length);
        }
        
        gameState.totalErrors = errors;
        
        // 计算速度和准确率
        let charsPerMinute = 0;
        let accuracy = 0;
        
        if (gameState.currentTime > 0) {
            charsPerMinute = Math.round((typedText.length / gameState.currentTime) * 60);
            
            if (typedText.length > 0) {
                accuracy = Math.round(((typedText.length - errors) / typedText.length) * 100);
            }
        }
        
        // 更新显示
        progressElement.textContent = `${progress}%`;
        errorsElement.textContent = errors;
        speedElement.textContent = charsPerMinute;
        accuracyElement.textContent = `${accuracy}%`;
    }

    // 本地完成游戏
    function finishGameLocally(typedText, originalText) {
        const errors = gameState.totalErrors;
        const elapsedTime = gameState.currentTime;
        const charsPerMinute = elapsedTime > 0 ? Math.round((typedText.length / elapsedTime) * 60) : 0;
        const accuracy = typedText.length > 0 ? Math.round(((typedText.length - errors) / typedText.length) * 100) : 0;
        
        const finalData = {
            completed: true,
            elapsed_time: elapsedTime.toFixed(2),
            chars_per_minute: charsPerMinute,
            accuracy: accuracy,
            errors: errors,
            category: gameState.selectedCategory || '随机',
            progress: 100
        };
        
        finishGame(finalData);
    }

    // 更新进度显示
    function updateProgress(data) {
        progressElement.textContent = `${data.progress || 0}%`;
        errorsElement.textContent = data.errors || 0;

        // 计算实时速度
        if (gameState.currentTime > 0) {
            const typedLength = data.typed_length || gameState.typedLength;
            const charsPerMinute = Math.round((typedLength / gameState.currentTime) * 60);
            speedElement.textContent = charsPerMinute;

            // 计算实时准确率
            if (typedLength > 0) {
                const errors = data.errors || gameState.totalErrors;
                const accuracy = Math.round(((typedLength - errors) / typedLength) * 100);
                accuracyElement.textContent = `${accuracy}%`;
            }
        }
    }

    // 完成游戏
    function finishGame(data) {
        console.log('游戏完成，显示结果:', data);
        
        // 确保游戏状态更新
        if (!gameState.isActive) {
            console.log('游戏已经结束，忽略重复调用');
            return;
        }
        
        // 停止计时器
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }
        
        gameState.isActive = false;
        
        // 更新最终结果
        finalTimeElement.textContent = `${data.elapsed_time || gameState.currentTime.toFixed(2)} 秒`;
        
        const finalSpeed = data.chars_per_minute || 
            (gameState.currentTime > 0 ? Math.round((gameState.typedLength / gameState.currentTime) * 60) : 0);
        finalSpeedElement.textContent = `${finalSpeed} 字/分钟`;
        
        const finalAccuracy = data.accuracy || 
            (gameState.typedLength > 0 ? Math.round(((gameState.typedLength - gameState.totalErrors) / gameState.typedLength) * 100) : 0);
        finalAccuracyElement.textContent = `${finalAccuracy}%`;
        
        // 确保有分类信息
        if (finalCategory) {
            finalCategory.textContent = data.category || gameState.selectedCategory || '随机';
        }
        
        // 显示结果面板 - 确保正确显示
        resultsElement.classList.remove('hidden');
        resultsElement.style.display = 'block';
        
        // 添加庆祝动画
        resultsElement.style.animation = 'celebrate 0.5s ease-in-out';
        
        // 滚动到结果区域
        setTimeout(() => {
            resultsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        
        // 更新按钮状态
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="fas fa-play"></i> 开始新游戏';
        resetBtn.disabled = true;
        inputArea.disabled = true;
        
        // 可选：保存成绩到排行榜
        saveScoreToLeaderboard({
            chars_per_minute: finalSpeed,
            accuracy: finalAccuracy,
            elapsed_time: data.elapsed_time || gameState.currentTime.toFixed(2),
            category: data.category || gameState.selectedCategory || '随机'
        });
        
        // 加载更新的排行榜
        loadLeaderboard();
        
        console.log('结果面板已显示');
    }

    // 保存成绩到排行榜
    async function saveScoreToLeaderboard(data) {
        try {
            const playerName = prompt('恭喜你完成了游戏！请输入你的名字（用于排行榜，留空则匿名）：', '') || '匿名玩家';
            
            const scoreData = {
                name: playerName.substring(0, 20), // 限制名字长度
                speed: data.chars_per_minute,
                accuracy: data.accuracy,
                time: data.elapsed_time,
                category: data.category
            };
            
            const response = await fetch('/api/save_score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scoreData)
            });
            
            if (response.ok) {
                console.log('成绩保存成功');
            } else {
                console.log('成绩保存失败，将只在本地显示');
            }
        } catch (error) {
            console.error('保存成绩时出错:', error);
            // 不显示错误，避免干扰用户体验
        }
    }

    // 开始计时器
    function startTimer() {
        clearInterval(gameState.timerInterval);
        gameState.currentTime = 0;
        timerElement.textContent = '0.00';

        gameState.timerInterval = setInterval(() => {
            gameState.currentTime += 0.1;
            timerElement.textContent = gameState.currentTime.toFixed(2);
        }, 100);
    }

    // 高亮显示文本
    function highlightText(typedText, originalText) {
        if (!originalText) return;
        
        let highlightedHTML = '';
        
        for (let i = 0; i < originalText.length; i++) {
            let char = originalText[i];
            
            // 转义HTML特殊字符
            if (char === '<') char = '&lt;';
            if (char === '>') char = '&gt;';
            if (char === '&') char = '&amp;';
            
            if (i < typedText.length) {
                if (typedText[i] === originalText[i]) {
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
        
        // 确保样式存在
        ensureHighlightStyles();
    }

    // 确保高亮样式存在
    function ensureHighlightStyles() {
        if (!document.getElementById('highlight-styles')) {
            const style = document.createElement('style');
            style.id = 'highlight-styles';
            style.textContent = `
                .correct { color: #10b981; font-weight: bold; }
                .incorrect { color: #ef4444; background: rgba(239, 68, 68, 0.1); text-decoration: line-through; }
                .next { border-bottom: 2px solid #f59e0b; background: rgba(245, 158, 11, 0.1); }
            `;
            document.head.appendChild(style);
        }
    }

    // ========== 分享功能 ==========

    // 分享结果
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
            const originalText = shareBtn.textContent;

            // 显示加载状态
            shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 复制中...';
            shareBtn.disabled = true;

            // 复制到剪贴板
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareText).then(() => {
                    // 成功
                    console.log('复制成功');
                    showShareSuccess(shareText);
                }).catch(err => {
                    console.error('复制失败:', err);
                    showShareFallback(shareText);
                }).finally(() => {
                    // 恢复按钮状态
                    setTimeout(() => {
                        shareBtn.innerHTML = originalHtml;
                        shareBtn.textContent = originalText;
                        shareBtn.disabled = false;
                    }, 1500);
                });
            } else {
                // 使用备用方法
                showShareFallback(shareText);
                
                // 恢复按钮状态
                setTimeout(() => {
                    shareBtn.innerHTML = originalHtml;
                    shareBtn.textContent = originalText;
                    shareBtn.disabled = false;
                }, 1500);
            }

        } catch (error) {
            console.error('分享过程中出错:', error);

            // 恢复按钮状态
            shareBtn.disabled = false;
            shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> 分享成绩';

            // 显示简单错误信息
            alert('分享失败，请手动复制成绩信息');
        }
    }

    // 显示分享成功
    function showShareSuccess(shareText) {
        const successMessage = `✅ 成绩已复制到剪贴板！\n\n` +
                             `📋 你可以粘贴到：\n` +
                             `• 微信/QQ聊天\n` +
                             `• 微博/朋友圈\n` +
                             `• 任何支持文本的地方\n\n` +
                             `📝 预览：\n` +
                             `${shareText.substring(0, 80)}...`;
        alert(successMessage);
    }

    // 显示分享备用方案
    function showShareFallback(shareText) {
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999); // 移动端支持

        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                alert('✅ 成绩已复制到剪贴板！\n\n现在可以粘贴分享了。');
            } else {
                throw new Error('复制命令失败');
            }
        } catch (err) {
            console.error('备用方法也失败:', err);
            
            // 显示文本让用户手动复制
            const fallbackMessage = `❌ 自动复制失败\n\n` +
                                  `请手动复制以下文本：\n\n` +
                                  `${shareText}\n\n` +
                                  `操作步骤：\n` +
                                  `1. 全选上面的文本\n` +
                                  `2. 复制 (Ctrl+C)\n` +
                                  `3. 粘贴到想要分享的地方`;
            alert(fallbackMessage);
        }
    }

    // ========== 排行榜功能 ==========

    // 加载排行榜
    async function loadLeaderboard() {
        console.log('加载排行榜数据...');

        try {
            // 显示加载状态
            refreshLeaderboardBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载中...';
            refreshLeaderboardBtn.disabled = true;

            const response = await fetch('/api/get_leaderboard');

            if (!response.ok) {
                throw new Error(`无法加载排行榜: ${response.status}`);
            }

            const leaderboard = await response.json();
            console.log('排行榜数据:', leaderboard);
            renderLeaderboard(leaderboard);

        } catch (error) {
            console.error('加载排行榜时出错:', error);
            
            // 显示模拟数据
            showMockLeaderboard();
            
            // 显示错误消息
            setTimeout(() => {
                leaderboardBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">
                            无法加载排行榜数据，显示模拟数据<br>
                            <small>${error.message}</small>
                        </td>
                    </tr>
                `;
            }, 1000);
        } finally {
            // 恢复按钮状态
            setTimeout(() => {
                refreshLeaderboardBtn.disabled = false;
                refreshLeaderboardBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 刷新排行榜';
            }, 1000);
        }
    }

    // 显示模拟排行榜数据
    function showMockLeaderboard() {
        const mockData = [
            { rank: 1, name: '打字高手', speed: 120, accuracy: 98, category: '编程技术', date: '2023-10-15' },
            { rank: 2, name: '键盘侠', speed: 110, accuracy: 96, category: '科技资讯', date: '2023-10-14' },
            { rank: 3, name: '匿名玩家', speed: 105, accuracy: 95, category: '生活常识', date: '2023-10-13' },
            { rank: 4, name: '练习生', speed: 95, accuracy: 92, category: '文学名句', date: '2023-10-12' },
            { rank: 5, name: '新手', speed: 85, accuracy: 88, category: '英语练习', date: '2023-10-11' },
            { rank: 6, name: '挑战者', speed: 80, accuracy: 85, category: '自定义', date: '2023-10-10' },
            { rank: 7, name: '学习者', speed: 75, accuracy: 90, category: '编程技术', date: '2023-10-09' },
            { rank: 8, name: '测试员', speed: 70, accuracy: 87, category: '科技资讯', date: '2023-10-08' },
            { rank: 9, name: '访客', speed: 65, accuracy: 84, category: '生活常识', date: '2023-10-07' },
            { rank: 10, name: '用户', speed: 60, accuracy: 82, category: '文学名句', date: '2023-10-06' }
        ];
        
        renderLeaderboard(mockData);
    }

    // 渲染排行榜
    function renderLeaderboard(leaderboard) {
        if (!leaderboard || !Array.isArray(leaderboard)) {
            console.error('排行榜数据无效:', leaderboard);
            leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">
                        排行榜数据格式错误
                    </td>
                </tr>
            `;
            return;
        }

        leaderboardBody.innerHTML = '';

        leaderboard.forEach((player, index) => {
            const row = document.createElement('tr');

            // 为前三名添加特殊样式
            let rankClass = '';
            let rankEmoji = '';
            if (index === 0) {
                rankClass = 'first';
                rankEmoji = '🥇 ';
            } else if (index === 1) {
                rankClass = 'second';
                rankEmoji = '🥈 ';
            } else if (index === 2) {
                rankClass = 'third';
                rankEmoji = '🥉 ';
            }

            row.innerHTML = `
                <td class="${rankClass}">${rankEmoji}${player.rank || index + 1}</td>
                <td>${player.name || '匿名玩家'}</td>
                <td>${player.speed || 0}</td>
                <td>${player.accuracy || 0}%</td>
                <td>${player.category || '随机'}</td>
                <td>${player.date || '刚刚'}</td>
            `;

            leaderboardBody.appendChild(row);
        });

        // 添加排行榜样式
        ensureLeaderboardStyles();
    }

    // 确保排行榜样式存在
    function ensureLeaderboardStyles() {
        if (!document.getElementById('leaderboard-styles')) {
            const style = document.createElement('style');
            style.id = 'leaderboard-styles';
            style.textContent = `
                .first { color: #f59e0b !important; font-weight: bold; font-size: 1.1em; }
                .second { color: #94a3b8 !important; font-weight: bold; }
                .third { color: #cd7f32 !important; font-weight: bold; }
                tbody tr:hover { background: rgba(99, 102, 241, 0.1) !important; }
            `;
            document.head.appendChild(style);
        }
    }

    // ========== 提示功能 ==========

    // 显示提示模态框
    function showHintModal() {
        hintModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    // 关闭提示模态框
    function closeHintModal() {
        hintModal.classList.add('hidden');
        document.body.style.overflow = ''; // 恢复背景滚动
    }

    // ========== 工具函数 ==========

    // 调整文本区域高度
    function adjustTextareaHeight() {
        inputArea.style.height = 'auto';
        inputArea.style.height = Math.min(inputArea.scrollHeight, 200) + 'px';
    }

    // 添加输入区域高度调整
    inputArea.addEventListener('input', adjustTextareaHeight);

    // 添加键盘快捷键
    document.addEventListener('keydown', function(e) {
        // Ctrl + Enter 开始游戏
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (!gameState.isActive) {
                startGame();
            }
        }
        
        // Esc 重置游戏
        if (e.key === 'Escape' && gameState.isActive) {
            if (confirm('确定要重置当前游戏吗？')) {
                resetGame();
            }
        }
        
        // F1 显示提示
        if (e.key === 'F1') {
            e.preventDefault();
            showHintModal();
        }
    });

    // 添加样式动画
    ensureCelebrationAnimation();

    function ensureCelebrationAnimation() {
        if (!document.getElementById('celebration-animation')) {
            const style = document.createElement('style');
            style.id = 'celebration-animation';
            style.textContent = `
                @keyframes celebrate {
                    0% { transform: scale(0.95); opacity: 0; }
                    70% { transform: scale(1.02); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                .pulse { animation: pulse 2s infinite; }
            `;
            document.head.appendChild(style);
        }
    }

    // 初始化完成
    console.log('打字游戏初始化完成，可以开始游戏！');
    
    // 显示欢迎消息
    setTimeout(() => {
        console.log('欢迎使用打字游戏！使用说明：\n1. 选择或输入文章\n2. 点击"开始游戏"按钮\n3. 在文本框中输入上方显示的文本\n4. 完成后查看成绩和排行榜');
    }, 1000);
});
