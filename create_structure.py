# create_structure.py
import os
import shutil


def create_project_structure():
    """创建完整的项目结构"""

    # 定义目录结构
    directories = ['static', 'templates']

    # 创建目录
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"📁 创建目录: {directory}")

    # 检查重要文件
    important_files = {
        'app.py': 'app.py',
        'templates/index.html': 'templates/index.html',
        'static/style.css': 'static/style.css',
        'static/game.js': 'static/game.js'
    }

    missing_files = []
    for file_path, _ in important_files.items():
        if not os.path.exists(file_path):
            missing_files.append(file_path)

    if missing_files:
        print("\n❌ 缺失以下文件:")
        for file in missing_files:
            print(f"  - {file}")
        print("\n请确保所有文件都在正确的位置。")
    else:
        print("\n✅ 所有文件都存在！")

    # 显示当前目录结构
    print("\n📂 当前目录结构:")
    for root, dirs, files in os.walk('.'):
        level = root.replace('.', '').count(os.sep)
        indent = ' ' * 4 * level
        print(f'{indent}{os.path.basename(root)}/')
        subindent = ' ' * 4 * (level + 1)
        for file in files:
            print(f'{subindent}{file}')


if __name__ == '__main__':
    create_project_structure()