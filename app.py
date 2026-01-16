from flask import Flask, render_template, jsonify, request
import random
import time
import os
import re
from datetime import datetime

app = Flask(__name__)

# 文章分类库
text_categories = {
    "编程技术": [
        "Python是一种广泛使用的高级编程语言，以其清晰的语法和代码可读性而闻名。",
        "Flask是一个轻量级的Python Web框架，简单易用但功能强大。",
        "JavaScript是一种用于Web开发的脚本语言，可以为网页添加交互功能。",
        "算法是解决问题的一系列步骤，好的算法可以显著提高程序效率。",
        "数据结构是计算机存储、组织数据的方式，常见的有数组、链表、栈、队列等。",
        "面向对象编程是一种程序设计范型，它使用对象来设计应用程序和计算机程序。",
        "数据库是存储和管理数据的系统，常见的有关系型数据库和非关系型数据库。",
        "版本控制系统如Git帮助开发者管理代码变更历史，便于协作和版本回退。",
        "API是应用程序编程接口，允许不同软件之间进行交互和数据交换。",
        "测试是软件开发的重要环节，确保代码质量和功能正确性。"
    ],
    "科技资讯": [
        "人工智能正在改变我们的生活方式，从语音助手到自动驾驶汽车。",
        "云计算使企业和个人能够通过互联网访问计算资源和存储空间。",
        "物联网将日常物品连接到互联网，使它们能够发送和接收数据。",
        "5G技术提供更快的网络速度和更低的延迟，推动了许多新应用的发展。",
        "区块链是一种分布式账本技术，最初为比特币等加密货币提供支持。",
        "虚拟现实和增强现实技术正在改变娱乐、教育和工业设计等领域。",
        "大数据技术帮助我们分析海量数据，从中发现有价值的模式和见解。",
        "量子计算利用量子力学的特性，有望解决传统计算机难以处理的问题。",
        "机器人技术结合人工智能，正在自动化许多工业和服务流程。",
        "生物识别技术如指纹和面部识别，提高了安全性和便利性。"
    ],
    "生活常识": [
        "健康饮食应包括丰富的水果、蔬菜、全谷物和优质蛋白质。",
        "定期运动有助于维持身体健康，预防多种慢性疾病。",
        "良好的睡眠习惯对身心健康至关重要，成人通常需要7-9小时睡眠。",
        "压力管理技巧包括冥想、深呼吸和定期休息。",
        "有效沟通是人际关系和职业成功的关键要素。",
        "时间管理技巧可以帮助我们更高效地完成任务，减少压力。",
        "理财规划包括预算制定、储蓄和投资等方面。",
        "持续学习是适应快速变化的世界的重要能力。",
        "保持积极心态有助于应对生活中的挑战和困难。",
        "建立良好的人际关系网络对个人和职业发展都很重要。"
    ],
    "文学名句": [
        "千里之行，始于足下。古代哲学家老子的名言，强调从小事做起的重要性。",
        "知识就是力量。英国哲学家弗朗西斯·培根的名言，强调知识的重要性。",
        "活着就是为了改变世界，难道还有其他原因吗？史蒂夫·乔布斯的经典名言。",
        "成功的秘诀在于对目标的坚持。美国发明家爱迪生关于坚持的名言。",
        "教育是最强大的武器，你可以用它来改变世界。纳尔逊·曼德拉的名言。",
        "不要问国家能为你做什么，而要问你能为国家做什么。约翰·肯尼迪的名言。",
        "生活就像一盒巧克力，你永远不知道你会得到什么。《阿甘正传》经典台词。",
        "要么忙着活，要么忙着死。《肖申克的救赎》中的经典台词。",
        "世上只有一种英雄主义，就是在认清生活真相之后依然热爱生活。罗曼·罗兰。",
        "梦想不会逃跑，会逃跑的永远都是自己。日本作家村上春树的名言。"
    ],
    "英语练习": [
        "The quick brown fox jumps over the lazy dog. This sentence contains all letters of the English alphabet.",
        "Practice makes perfect. Consistent effort leads to improvement in any skill over time.",
        "Programming is the process of creating a set of instructions that tell a computer how to perform a task.",
        "Artificial intelligence refers to the simulation of human intelligence in machines.",
        "Learning a new language opens doors to understanding different cultures and perspectives.",
        "Technology has transformed the way we work, communicate, and access information.",
        "Reading is to the mind what exercise is to the body. It strengthens and enriches our thoughts.",
        "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "The only way to do great work is to love what you do. Steve Jobs' famous quote.",
        "Innovation distinguishes between a leader and a follower. Another insightful quote by Steve Jobs."
    ],
    "自定义": []  # 用于存储用户自定义的文章
}

# 游戏状态存储
games = {}
leaderboard_data = []


@app.route('/')
def index():
    """渲染游戏主页面"""
    return render_template('index.html')


@app.route('/game')
def game_page():
    """渲染文章选择游戏页面"""
    return render_template('game.html')


@app.route('/api/categories')
def get_categories():
    """获取文章分类列表"""
    categories = list(text_categories.keys())
    return jsonify({
        'success': True,
        'categories': categories,
        'total_categories': len(categories),
        'total_articles': sum(len(articles) for articles in text_categories.values())
    })


@app.route('/api/articles')
def get_articles():
    """获取特定分类的文章"""
    category = request.args.get('category', '')

    try:
        if not category:
            # 返回所有文章
            all_articles = []
            for cat, articles in text_categories.items():
                if cat != "自定义" or articles:  # 只显示有内容的自定义分类
                    for article in articles:
                        all_articles.append({
                            'category': cat,
                            'text': article,
                            'length': len(article)
                        })

            random.shuffle(all_articles)  # 随机排序

            return jsonify({
                'success': True,
                'articles': all_articles,
                'total': len(all_articles)
            })

        if category in text_categories:
            articles = text_categories[category]
            if not articles and category == "自定义":
                return jsonify({
                    'success': True,
                    'category': category,
                    'articles': [],
                    'total': 0,
                    'message': '自定义分类暂无文章，请添加自定义文章'
                })

            article_list = [{'text': text, 'category': category, 'length': len(text)} for text in articles]

            return jsonify({
                'success': True,
                'category': category,
                'articles': article_list,
                'total': len(articles)
            })
        else:
            return jsonify({'success': False, 'error': '分类不存在'}), 404

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/custom_article', methods=['POST'])
def add_custom_article():
    """添加自定义文章"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': '请求数据为空'}), 400

        text = data.get('text', '').strip()
        category = data.get('category', '自定义').strip()

        if not text:
            return jsonify({'success': False, 'error': '文章内容不能为空'}), 400

        if len(text) < 10:
            return jsonify({'success': False, 'error': '文章太短，至少需要10个字符'}), 400

        if len(text) > 1000:
            return jsonify({'success': False, 'error': '文章太长，最多1000个字符'}), 400

        # 确保自定义分类存在
        if '自定义' not in text_categories:
            text_categories['自定义'] = []

        # 避免重复添加
        if text not in text_categories['自定义']:
            text_categories['自定义'].append(text)

        return jsonify({
            'success': True,
            'message': '自定义文章添加成功',
            'category': '自定义',
            'length': len(text),
            'text_preview': text[:50] + '...' if len(text) > 50 else text
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/start_game', methods=['POST'])
def start_game():
    """开始新游戏"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': '请求数据为空'}), 400

        game_id = str(int(time.time() * 1000) + random.randint(1000, 9999))

        # 获取用户选择的文章
        selected_text = data.get('text', '').strip()
        category = data.get('category', '').strip()

        # 如果用户没有提供文本，随机选择一个
        if not selected_text:
            all_articles = []
            for cat, articles in text_categories.items():
                if articles:  # 只选择有文章的类别
                    for article in articles:
                        all_articles.append({
                            'text': article,
                            'category': cat
                        })

            if not all_articles:
                selected_text = "欢迎使用打字游戏！请在这里输入文本以开始练习。这是一个示例文本，用于测试打字速度和准确性。"
                category = "示例"
            else:
                selected_article = random.choice(all_articles)
                selected_text = selected_article['text']
                category = selected_article['category']
        elif not category:
            category = '自定义'  # 如果提供了文本但没有分类，默认为自定义

        # 确保文本长度合适
        if len(selected_text) > 1000:
            selected_text = selected_text[:1000] + "..."

        games[game_id] = {
            'text': selected_text,
            'start_time': time.time(),
            'completed': False,
            'errors': 0,
            'typed_text': '',
            'category': category,
            'last_activity': time.time()
        }

        # 清理过期的游戏记录（超过1小时）
        cleanup_old_games()

        return jsonify({
            'success': True,
            'game_id': game_id,
            'text': selected_text,
            'category': category,
            'length': len(selected_text),
            'message': '游戏开始！'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


def cleanup_old_games():
    """清理过期的游戏记录"""
    current_time = time.time()
    expired_games = []

    for game_id, game in games.items():
        if current_time - game['last_activity'] > 3600:  # 1小时
            expired_games.append(game_id)

    for game_id in expired_games:
        del games[game_id]


@app.route('/api/check_progress', methods=['POST'])
def check_progress():
    """检查游戏进度"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': '请求数据为空'}), 400

        game_id = data.get('game_id')
        typed_text = data.get('typed_text', '')

        if not game_id:
            return jsonify({'success': False, 'error': '缺少游戏ID'}), 400

        if game_id not in games:
            return jsonify({'success': False, 'error': '游戏不存在或已过期'}), 404

        game = games[game_id]
        original_text = game['text']

        # 更新最后活动时间
        game['last_activity'] = time.time()

        # 计算正确字符数和错误数
        correct_chars = 0
        errors = 0
        typed_length = len(typed_text)
        original_length = len(original_text)

        for i in range(typed_length):
            if i < original_length:
                if typed_text[i] == original_text[i]:
                    correct_chars += 1
                else:
                    errors += 1
            else:
                # 如果输入的比目标长，额外的字符也算错误
                errors += 1

        # 更新游戏状态
        game['errors'] = errors
        game['typed_text'] = typed_text

        # 检查是否完成
        completed = typed_length >= original_length
        if completed:
            game['completed'] = True
            elapsed_time = time.time() - game['start_time']
            chars_per_minute = (original_length / elapsed_time) * 60 if elapsed_time > 0 else 0
            accuracy = ((original_length - errors) / original_length) * 100 if original_length > 0 else 0

            # 保存到排行榜
            save_to_leaderboard(game, elapsed_time, chars_per_minute, accuracy, errors)

            return jsonify({
                'success': True,
                'completed': True,
                'elapsed_time': round(elapsed_time, 2),
                'chars_per_minute': round(chars_per_minute, 2),
                'accuracy': round(accuracy, 2),
                'errors': errors,
                'typed_length': typed_length,
                'total_length': original_length,
                'progress': 100,
                'category': game.get('category', '未知')
            })

        # 计算进度
        progress = round((typed_length / original_length) * 100, 2) if original_length > 0 else 0

        # 计算实时速度
        elapsed_time = time.time() - game['start_time']
        chars_per_minute = (typed_length / elapsed_time) * 60 if elapsed_time > 0 else 0

        return jsonify({
            'success': True,
            'completed': False,
            'typed_length': typed_length,
            'total_length': original_length,
            'errors': errors,
            'progress': progress,
            'chars_per_minute': round(chars_per_minute, 2),
            'accuracy': round(((typed_length - errors) / typed_length * 100), 2) if typed_length > 0 else 0,
            'category': game.get('category', '未知')
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


def save_to_leaderboard(game, elapsed_time, chars_per_minute, accuracy, errors):
    """保存游戏结果到排行榜"""
    global leaderboard_data
    
    leaderboard_data.append({
        'name': '匿名玩家',
        'speed': round(chars_per_minute),
        'accuracy': round(accuracy, 1),
        'time': round(elapsed_time, 2),
        'errors': errors,
        'category': game.get('category', '随机'),
        'date': datetime.now().strftime('%Y-%m-%d %H:%M'),
        'text_length': len(game['text'])
    })
    
    # 按速度排序，只保留前50名
    leaderboard_data.sort(key=lambda x: x['speed'], reverse=True)
    leaderboard_data = leaderboard_data[:50]
    
    # 添加排名
    for i, entry in enumerate(leaderboard_data[:10], 1):
        entry['rank'] = i


@app.route('/api/save_score', methods=['POST'])
def save_score():
    """保存游戏成绩"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': '请求数据为空'}), 400

        player_name = data.get('name', '匿名玩家').strip()
        if not player_name:
            player_name = '匿名玩家'

        # 限制名字长度
        if len(player_name) > 20:
            player_name = player_name[:20]

        # 找到最新的一条记录并更新名字
        if leaderboard_data:
            leaderboard_data[-1]['name'] = player_name

        return jsonify({
            'success': True,
            'message': '成绩保存成功',
            'player_name': player_name
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/get_leaderboard')
def get_leaderboard():
    """获取排行榜"""
    try:
        # 如果没有真实数据，提供示例数据
        if not leaderboard_data:
            sample_data = [
                {'rank': 1, 'name': '打字高手', 'speed': 320, 'accuracy': 99.8, 'category': '编程技术', 'date': '2023-10-15'},
                {'rank': 2, 'name': '键盘侠', 'speed': 298, 'accuracy': 98.5, 'category': '科技资讯', 'date': '2023-10-14'},
                {'rank': 3, 'name': '代码猎人', 'speed': 285, 'accuracy': 99.2, 'category': '编程技术', 'date': '2023-10-13'},
                {'rank': 4, 'name': '文学爱好者', 'speed': 276, 'accuracy': 97.8, 'category': '文学名句', 'date': '2023-10-12'},
                {'rank': 5, 'name': '英语达人', 'speed': 265, 'accuracy': 96.5, 'category': '英语练习', 'date': '2023-10-11'},
                {'rank': 6, 'name': '生活百科', 'speed': 250, 'accuracy': 95.3, 'category': '生活常识', 'date': '2023-10-10'},
                {'rank': 7, 'name': '科技先锋', 'speed': 235, 'accuracy': 98.1, 'category': '科技资讯', 'date': '2023-10-09'},
                {'rank': 8, 'name': '编程新手', 'speed': 220, 'accuracy': 94.7, 'category': '编程技术', 'date': '2023-10-08'},
                {'rank': 9, 'name': '全能选手', 'speed': 210, 'accuracy': 97.3, 'category': '随机', 'date': '2023-10-07'},
                {'rank': 10, 'name': '练习生', 'speed': 195, 'accuracy': 92.5, 'category': '自定义', 'date': '2023-10-06'}
            ]
            return jsonify(sample_data)

        # 获取前10名
        top_10 = leaderboard_data[:10]

        # 确保每条记录都有rank
        for i, entry in enumerate(top_10, 1):
            entry['rank'] = i

        return jsonify(top_10)

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/article_stats')
def article_stats():
    """获取文章统计信息"""
    try:
        stats = {}
        for category, articles in text_categories.items():
            if category != "自定义" or articles:  # 只显示有内容的自定义分类
                stats[category] = {
                    'count': len(articles),
                    'total_chars': sum(len(article) for article in articles),
                    'avg_chars': sum(len(article) for article in articles) // len(articles) if articles else 0
                }

        return jsonify({
            'success': True,
            'stats': stats,
            'total_categories': len(stats),
            'total_articles': sum(stat['count'] for stat in stats.values())
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/cleanup_games', methods=['POST'])
def cleanup_games():
    """清理所有游戏记录（开发用）"""
    try:
        count_before = len(games)
        games.clear()
        return jsonify({
            'success': True,
            'message': f'已清理 {count_before} 个游戏记录',
            'games_remaining': 0
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/health')
def health_check():
    """健康检查端点"""
    return jsonify({
        'status': 'healthy',
        'games_active': len(games),
        'categories_count': len(text_categories),
        'timestamp': datetime.now().isoformat()
    })


if __name__ == '__main__':
    print("🚀 启动打字游戏服务器...")
    print("📚 文章分类:", list(text_categories.keys()))
    total_articles = sum(len(articles) for articles in text_categories.values())
    print(f"📝 文章总数: {total_articles}")
    print(f"🎮 游戏功能: 支持{len(text_categories)}个分类，自定义文章，实时排行榜")
    print("🌐 访问地址: http://localhost:5000")
    print("   - 主页: http://localhost:5000")
    print("   - 文章选择游戏: http://localhost:5000/game")
    print("   - 健康检查: http://localhost:5000/health")
    print("-" * 50)

    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
