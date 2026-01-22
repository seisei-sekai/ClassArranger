# 测试快速参考

**Created:** 2026-01-22
**Last Updated:** 2026-01-22
**Purpose:** 测试命令快速参考手册

---


## 🚀 快速开始

### 运行所有验证（推荐）

```bash
./scripts/verify.sh
```

---

## 前端测试

### 安装依赖
```bash
cd frontend
npm install
```

### 命令

| 命令 | 说明 |
|------|------|
| `npm run test` | 运行所有测试（监听模式） |
| `npm run test:unit` | 运行单元测试（一次） |
| `npm run test:watch` | 监听模式 |
| `npm run test:coverage` | 生成覆盖率报告 |
| `npm run test:ui` | 交互式测试 UI |
| `npm run test:e2e` | 端到端测试 |
| `npm run lint` | ESLint 检查 |
| `npm run build` | 构建验证 |

### 示例

```bash
# 运行特定测试文件
npm run test:unit constants.test.js

# 监听特定文件
npm run test:watch studentParser

# 查看覆盖率
npm run test:coverage
open coverage/index.html
```

---

## 后端测试

### 安装依赖
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install pytest pytest-cov pytest-asyncio
```

### 命令

| 命令 | 说明 |
|------|------|
| `pytest` | 运行所有测试 |
| `pytest -v` | 详细输出 |
| `pytest -vv` | 更详细输出 |
| `pytest --cov=app` | 生成覆盖率 |
| `pytest --cov-report=html` | HTML 覆盖率报告 |
| `pytest -m unit` | 只运行单元测试 |
| `pytest -m integration` | 只运行集成测试 |
| `pytest -k test_name` | 运行特定测试 |
| `flake8 app` | 代码检查 |
| `mypy app` | 类型检查 |

### 示例

```bash
# 运行特定测试文件
pytest tests/test_main.py -v

# 运行特定测试函数
pytest tests/test_main.py::test_health_check -v

# 生成覆盖率 HTML 报告
pytest --cov=app --cov-report=html
open htmlcov/index.html

# 只运行失败的测试
pytest --lf

# 显示最慢的10个测试
pytest --durations=10
```

---

## GitHub Actions

### 查看状态

```bash
# 列出所有运行
gh run list

# 查看最近运行
gh run view

# 查看日志
gh run view --log

# 实时监控
gh run watch
```

### 手动触发

```bash
# 触发 workflow
gh workflow run ci-cd.yml

# 触发测试
gh workflow run test.yml
```

---

## 编写测试

### 前端测试示例

```javascript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('');
    expect(myFunction(null)).toBe(null);
  });
});
```

### 后端测试示例

```python
import pytest

@pytest.mark.unit
def test_health_check(test_client):
    response = test_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@pytest.mark.integration
def test_create_diary(test_client, auth_headers, test_diary):
    response = test_client.post(
        "/diaries",
        json=test_diary,
        headers=auth_headers
    )
    assert response.status_code == 201
```

---

## 测试覆盖率目标

| 组件 | 目标 | 命令 |
|------|------|------|
| 前端 Utils | 80%+ | `npm run test:coverage` |
| 前端组件 | 70%+ | `npm run test:coverage` |
| 后端 API | 80%+ | `pytest --cov=app` |
| 后端服务 | 70%+ | `pytest --cov=app` |

---

## 故障排除

### 前端测试失败

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install

# 清理缓存
rm -rf coverage .vitest
```

### 后端测试失败

```bash
# 重新创建虚拟环境
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 清理缓存
rm -rf .pytest_cache __pycache__
find . -type d -name __pycache__ -exec rm -rf {} +
```

### CI/CD 失败

```bash
# 查看详细日志
gh run view --log

# 本地复现
./scripts/verify.sh

# 检查 Secrets 配置
gh secret list
```

---

## 持续集成配置

### 必需的 GitHub Secrets

```
GCP_PROJECT_ID
GCP_SA_KEY
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
FIREBASE_PROJECT_ID
OPENAI_API_KEY
VITE_API_URL
```

### 添加 Secret

```bash
# 使用 gh CLI
gh secret set SECRET_NAME

# 或在 GitHub 网页
# Settings → Secrets and variables → Actions → New repository secret
```

---

## AI Agent 验证流程

### 1. 本地验证
```bash
./scripts/verify.sh
```

### 2. 提交代码
```bash
git add .
git commit -m "feat: add new feature"
git push origin feature-branch
```

### 3. 创建 PR
```bash
gh pr create --title "Add new feature" --body "Description"
```

### 4. 检查 CI 状态
```bash
gh pr checks
```

### 5. 合并（CI 通过后）
```bash
gh pr merge
```

---

## 性能优化

### 加速测试

```bash
# 前端 - 并行运行
npm run test:unit -- --reporter=dot

# 后端 - 并行运行
pytest -n auto

# 只运行修改的测试
npm run test:unit -- --changed
pytest --testmon
```

---

## 有用的资源

- [Vitest 文档](https://vitest.dev/)
- [Pytest 文档](https://docs.pytest.org/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Testing Library](https://testing-library.com/)

---

最后更新：2026-01-22

