# Terraform VM Configuration

**这是实际配置文件所在目录。**

## 📋 文件列表

| 文件 | 作用 |
|------|------|
| `main.tf` | 资源定义（VM、防火墙等） |
| `variables.tf` | 变量定义 |
| `outputs.tf` | 输出值（IP、URL等） |
| `terraform.tfvars` | **你的配置**（不提交到Git） |
| `terraform.tfvars.example` | 配置示例 |
| `startup-script.sh` | VM 启动脚本模板 |
| `deploy-app.sh` | 应用部署脚本模板 |

## 🚀 快速开始

### 新手？先看这个！

📖 **[Terraform 新手指南](../BEGINNER-GUIDE.md)** - 详细解释每一步

### 有经验的开发者

```bash
# 1. 配置
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars  # 填写 project_id

# 2. 部署
terraform init
terraform plan
terraform apply

# 3. 查看输出
terraform output
```

## ⚙️ 配置说明

### 必填项

```hcl
# terraform.tfvars
project_id = "your-project-id"  # ⚠️ 必须修改
```

### 可选项（有默认值）

```hcl
region     = "asia-northeast1"      # 东京（默认）
zone       = "asia-northeast1-a"    # 东京A区（默认）
machine_type = "e2-medium"          # 2核4G（默认）
boot_disk_size = 20                 # 20GB（默认）
use_static_ip = false               # 动态IP（默认）
git_repo_url = ""                   # Git仓库URL（可选）
```

## 🏗️ 创建的资源

1. **VM 实例** - `classarranger-vm`
   - 机器类型：e2-medium（2核4G）
   - 操作系统：Ubuntu 22.04 LTS
   - 磁盘：20GB 标准持久化磁盘
   - 区域：东京（asia-northeast1-a）

2. **防火墙规则**
   - `classarranger-http` - 允许 HTTP (80)
   - `classarranger-api` - 允许 API (8000)

3. **静态 IP**（如果 `use_static_ip = true`）
   - 固定的外部 IP 地址

4. **自动配置**
   - Docker + Docker Compose 安装
   - Git 仓库克隆（如果提供）
   - 应用自动部署

## 💰 成本估算

**月费用（东京区域）：**
- VM (e2-medium): ~$27
- 磁盘 (20GB): ~$2
- 网络流量: ~$2-5
- 静态 IP（可选）: ~$3
- **总计: ~$31-37/月**

**节省成本：**
```hcl
# 使用更小的机器
machine_type = "e2-small"  # 省 ~$13/月
```

## 📝 常用命令

```bash
# 初始化（首次运行）
terraform init

# 预览更改
terraform plan

# 应用更改
terraform apply

# 查看输出
terraform output

# 获取特定输出
terraform output external_ip

# 查看状态
terraform show

# 格式化代码
terraform fmt

# 验证配置
terraform validate

# 销毁所有资源（危险！）
terraform destroy
```

## 🔍 查看部署信息

```bash
# 获取 VM IP
terraform output external_ip

# 获取访问 URL
terraform output frontend_url
terraform output backend_url

# 获取 SSH 命令
terraform output ssh_command

# 复制 SSH 命令并执行
eval $(terraform output -raw ssh_command)
```

## 🔧 修改配置

### 更改机器类型

```bash
# 1. 编辑 terraform.tfvars
vim terraform.tfvars
# machine_type = "e2-small"

# 2. 预览更改
terraform plan

# 3. 应用（VM会重启）
terraform apply
```

### 启用静态 IP

```bash
# 1. 编辑 terraform.tfvars
# use_static_ip = true

# 2. 应用
terraform apply

# 3. 查看新的静态 IP
terraform output static_ip
```

### 添加 Git 自动部署

```bash
# 1. 编辑 terraform.tfvars
# git_repo_url = "https://github.com/your-username/ClassArranger.git"

# 2. 应用（VM会重新配置）
terraform apply
```

## 🆘 故障排查

### 权限错误

```bash
# 重新认证
gcloud auth application-default login

# 启用必要的 API
gcloud services enable compute.googleapis.com
```

### State 文件问题

```bash
# 如果 state 文件丢失
terraform import google_compute_instance.app classarranger-vm
terraform import google_compute_firewall.http classarranger-http
terraform import google_compute_firewall.api classarranger-api
```

### 部署失败

```bash
# 查看 VM 启动日志
gcloud compute instances get-serial-port-output classarranger-vm \
  --zone=asia-northeast1-a

# SSH 到 VM 查看
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a
sudo docker ps
sudo docker logs classarranger-backend-1
```

## 📚 相关文档

- **[🎓 Terraform 新手指南](../BEGINNER-GUIDE.md)** - 详细教程（推荐新手）
- **[📖 完整部署指南](../../docs/beginner-deploy-guide.md)** - 从零到生产
- **[✨ Git 部署指南](../../docs/git-deployment-guide.md)** - 日常部署
- **[📋 脚本说明](../../scripts/README.md)** - 部署脚本使用

## ⚠️ 重要提醒

1. **不要提交** `terraform.tfvars` 到 Git
2. **不要删除** `terraform.tfstate` 和 `terraform.tfstate.backup`
3. **先 plan 再 apply** - 预览更改避免意外
4. **定期备份** state 文件
5. **destroy 前备份数据** - MongoDB 数据会丢失

## 🎯 最佳实践

### ✅ DO（推荐）

- 使用 `terraform plan` 预览更改
- 版本控制 `.tf` 文件
- 定期备份 state 文件
- 使用变量而非硬编码
- 添加有意义的注释

### ❌ DON'T（避免）

- 提交 `terraform.tfvars` 到 Git
- 手动编辑 state 文件
- 直接 `destroy` 生产环境
- 硬编码敏感信息
- 跳过 `plan` 直接 `apply`

---

**需要帮助？** 查看 [Terraform 新手指南](../BEGINNER-GUIDE.md) 或 [完整部署指南](../../docs/beginner-deploy-guide.md)
