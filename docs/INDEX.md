# Documentation Index

**Created:** 2026-01-22  
**Last Updated:** 2026-01-23  
**Purpose:** Central index of all project documentation files

---

## 📚 Documentation Files

This index tracks all markdown documentation files in the `docs/` folder.

### Format
Each documentation file should include:
- **Created:** YYYY-MM-DD
- **Last Updated:** YYYY-MM-DD
- **Purpose:** Brief description

---

## 📋 Document List

### Development Guides
- [Local Development Guide](./local-run.md) - 本地运行和开发指南 (Created: 2026-01-22)
- [Local MongoDB Guide](./local-mongodb-guide.md) - 本地MongoDB使用和管理指南 (Created: 2026-01-22)
- [Mock Mode Guide](./mock-mode-guide.md) - Mock模式使用指南（无需Firebase和OpenAI）(Created: 2026-01-22)
- [Mock Implementation Summary](./mock-implementation-summary.md) - Mock模式实现总结和技术细节 (Created: 2026-01-22)
- [Testing Quick Reference](./testing-quick-reference.md) - 测试命令快速参考手册 (Created: 2026-01-22)
- [Cursor Rules Guide](./cursor-rules-guide.md) - Cursor IDE AI 助手规则使用指南 (Created: 2026-01-22)

### Deployment
- **[⭐ Beginner Deploy Guide](./beginner-deploy-guide.md) - 小白部署指南（Terraform + GCP VM，Infrastructure as Code）(Created: 2026-01-22)**
- **[✨ Git Deployment Guide](./git-deployment-guide.md) - Git部署指南（Best Practice，推荐使用）(Created: 2026-01-23)**
- [Terraform Guide](./terraform-guide.md) - Terraform Infrastructure as Code 完整指南 (Created: 2026-01-22)
- [Terraform Implementation Summary](./terraform-implementation-summary.md) - Terraform实现总结和架构说明 (Created: 2026-01-22)
- [Deployment Comparison](./deployment-comparison.md) - 部署方案对比（GCP VM vs Cloud Run vs 本地）(Created: 2026-01-22)
- [GCP Deployment Guide](./gcp-deployment-guide.md) - GCP Cloud Run 完整部署指南（需要MongoDB Atlas）(Created: 2026-01-22)
- [Quick Deploy Guide](./quick-deploy.md) - 5步快速部署指南 (Created: 2026-01-22)
- [CI/CD Guide](./ci-cd-guide.md) - CI/CD 和测试完整指南 (Created: 2026-01-22)
- [CI/CD Setup Summary](./ci-cd-setup-summary.md) - CI/CD 和测试系统设置总结 (Created: 2026-01-22)

### Architecture & Design
- [ ] Domain Driven Design Guide (to be created)
- [ ] Architecture Overview (to be created)

### API Documentation
- [ ] API Reference (to be created)
- [ ] API Design Guidelines (to be created)

### User Guides
- [ ] User Manual (to be created)
- [ ] Admin Guide (to be created)

---

## 📝 Adding New Documentation

When creating a new documentation file:

1. **Create file in `docs/` folder**
   ```bash
   docs/your-document-name.md
   ```

2. **Add header with metadata**
   ```markdown
   # Document Title
   
   **Created:** YYYY-MM-DD
   **Last Updated:** YYYY-MM-DD
   **Purpose:** Brief description
   
   ---
   ```

3. **Update this index**
   - Add entry to appropriate section
   - Include link to file
   - Add creation date

4. **Follow naming convention**
   - Use kebab-case: `deployment-guide.md`
   - Be descriptive: `api-reference.md`
   - Use English names

---

## 🔄 Maintenance

- **Update Last Updated** when modifying documents
- **Keep index current** - add new documents immediately
- **Remove entries** for deleted documents
- **Review quarterly** - ensure all docs are still relevant

---

## 📖 Root Directory Files

The following markdown files exist in the root directory:
- `README.md` - Main project README (keep in root)

All other documentation files have been moved to `docs/` folder with proper headers.

---

Last Updated: 2026-01-23
