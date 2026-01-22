# ClassArranger Terraform VM Configuration

使用Terraform Infrastructure as Code (IaC)自动部署ClassArranger到GCP Compute Engine VM。

---

## 📋 功能特性

- ✅ **自动化部署** - 一键创建整套基础设施
- ✅ **Infrastructure as Code** - 版本控制和可重复
- ✅ **预览更改** - terraform plan查看执行计划
- ✅ **本地MongoDB** - 数据存储在VM本地容器
- ✅ **自动配置** - 防火墙、网络、启动脚本
- ✅ **CI/CD集成** - GitHub Actions自动部署

---

## 🚀 快速开始

### 1. 前置条件

```bash
# 安装Terraform
brew install terraform  # Mac
choco install terraform  # Windows

# 登录GCP
gcloud auth login
gcloud auth application-default login

# 设置项目
gcloud config set project YOUR_PROJECT_ID
```

### 2. 配置

```bash
# 复制配置文件
cp terraform.tfvars.example terraform.tfvars

# 编辑配置（必须）
nano terraform.tfvars
```

**最小配置:**
```hcl
project_id = "your-gcp-project-id"  # 必填
region     = "asia-northeast1"  # 东京区域
zone       = "asia-northeast1-a"  # 东京可用区A
```

### 3. 部署

```bash
# 初始化
terraform init

# 查看执行计划
terraform plan

# 应用更改
terraform apply
```

### 4. 获取访问地址

```bash
# 显示所有输出
terraform output

# 获取前端URL
terraform output frontend_url

# 获取SSH命令
terraform output ssh_command
```

---

## 📁 文件说明

```
terraform/vm/
├── main.tf                    # 主配置文件
│   ├── Provider配置
│   ├── API启用
│   ├── 防火墙规则
│   ├── 静态IP（可选）
│   ├── VM实例
│   └── 健康检查
│
├── variables.tf               # 变量定义
│   ├── project_id（必需）
│   ├── region/zone
│   ├── instance_name
│   ├── machine_type
│   ├── boot_disk_size
│   ├── use_static_ip
│   └── 其他配置
│
├── outputs.tf                 # 输出定义
│   ├── external_ip
│   ├── frontend_url
│   ├── backend_url
│   ├── ssh_command
│   └── deployment_info
│
├── terraform.tfvars.example  # 配置示例
├── startup-script.sh         # VM启动脚本模板
├── deploy-app.sh            # 应用部署脚本
└── README.md                # 本文件
```

---

## ⚙️ 配置选项

### 基本配置

| 变量 | 描述 | 默认值 | 必需 |
|------|------|--------|------|
| `project_id` | GCP项目ID | - | ✅ |
| `region` | GCP区域 | asia-northeast1 (东京) | ❌ |
| `zone` | GCP可用区 | asia-northeast1-a (东京A) | ❌ |
| `instance_name` | VM实例名称 | classarranger-vm | ❌ |

### VM配置

| 变量 | 描述 | 默认值 | 选项 |
|------|------|--------|------|
| `machine_type` | 机器类型 | e2-medium | e2-micro, e2-small, e2-medium, e2-standard-2 |
| `boot_disk_size` | 磁盘大小(GB) | 20 | 10-100 |

**机器类型对比:**
```
e2-micro      : 0.25-2 vCPU, 1GB RAM  (~$6/月)   - 仅测试
e2-small      : 0.5-2 vCPU,  2GB RAM  (~$13/月)  - 轻量使用
e2-medium     : 2 vCPU,      4GB RAM  (~$25/月)  - 推荐 ⭐
e2-standard-2 : 2 vCPU,      8GB RAM  (~$49/月)  - 高负载
```

### 网络配置

| 变量 | 描述 | 默认值 | 说明 |
|------|------|--------|------|
| `use_static_ip` | 使用静态IP | false | true=固定IP($3/月), false=动态IP(免费) |

### 部署配置

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `git_repo_url` | Git仓库URL | "" |
| `wait_for_deployment` | 等待部署完成 | true |

---

## 📊 创建的资源

Terraform会创建以下GCP资源：

1. **google_project_service.compute**
   - 启用Compute Engine API

2. **google_compute_firewall.http**
   - 允许HTTP流量（端口80）
   - 允许所有来源
   - 标签：classarranger

3. **google_compute_firewall.api**
   - 允许API流量（端口8000）
   - 允许所有来源
   - 标签：classarranger

4. **google_compute_address.static** (可选)
   - 静态外部IP地址
   - 仅当 use_static_ip=true 时创建

5. **google_compute_instance.app**
   - Ubuntu 22.04 LTS
   - 配置的机器类型和磁盘
   - 启动脚本自动安装Docker
   - 自动部署应用

---

## 🔄 工作流程

### 开发流程

```bash
# 1. 修改配置
vi main.tf

# 2. 格式化
terraform fmt

# 3. 验证
terraform validate

# 4. 查看计划
terraform plan

# 5. 应用更改
terraform apply

# 6. 查看输出
terraform output
```

### 更新应用

```bash
# 方法1: 标记VM需要重建
terraform taint google_compute_instance.app
terraform apply

# 方法2: 使用部署脚本（推荐）
cd ../..
./scripts/terraform-deploy.sh

# 方法3: 手动SSH更新
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a
cd /opt/classarranger
git pull  # 如果使用git
docker-compose -f docker-compose.prod.yml restart
```

### 销毁资源

```bash
# 查看将要删除的资源
terraform plan -destroy

# 销毁所有资源
terraform destroy

# 或使用变量文件
terraform destroy -var-file=terraform.tfvars
```

---

## 🔍 常用命令

```bash
# 查看当前状态
terraform show

# 查看资源列表
terraform state list

# 查看特定资源
terraform state show google_compute_instance.app

# 刷新状态
terraform refresh

# 格式化所有文件
terraform fmt -recursive

# 生成依赖图
terraform graph

# 查看输出（脚本友好）
EXTERNAL_IP=$(terraform output -raw external_ip)
echo "Visit: http://$EXTERNAL_IP"
```

---

## 🐛 故障排除

### 问题1: Init失败

```bash
# 错误: Failed to query available provider packages
rm -rf .terraform
terraform init
```

### 问题2: 权限错误

```bash
# 错误: Error 403: Permission denied
# 检查：
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID

# 确认计费已启用
gcloud billing projects describe YOUR_PROJECT_ID
```

### 问题3: VM无法访问

```bash
# 检查VM状态
gcloud compute instances list

# 查看VM日志
gcloud compute instances get-serial-port-output classarranger-vm --zone=asia-northeast1-a

# SSH到VM检查
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a
docker-compose -f /opt/classarranger/docker-compose.prod.yml ps
```

### 问题4: 状态锁定

```bash
# 错误: Error acquiring the state lock
# 如果确定没有其他terraform在运行：
terraform force-unlock LOCK_ID
```

---

## 💰 成本估算

**每月费用（asia-northeast1 东京）:**

```
VM实例 (e2-medium)      : $25
磁盘 (20GB)            : $2
静态IP (可选)           : $3
网络出站               : $0-5
──────────────────────────
总计                   : $27-35/月
```

**节省成本:**
- 使用e2-small: ~$13/月
- 关闭时停止VM: 只付磁盘费
- 不使用静态IP: 节省$3/月
- 使用GCP $300免费额度

---

## 🔐 安全建议

### 生产环境

1. **限制SSH访问**
```hcl
resource "google_compute_firewall" "ssh" {
  name = "classarranger-ssh"
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  source_ranges = ["YOUR_OFFICE_IP/32"]  # 限制来源IP
}
```

2. **使用服务账号**
```hcl
resource "google_service_account" "app" {
  account_id   = "classarranger-app"
  display_name = "ClassArranger Application"
}

resource "google_compute_instance" "app" {
  service_account {
    email  = google_service_account.app.email
    scopes = ["cloud-platform"]
  }
}
```

3. **启用HTTPS**
- 配置域名
- 使用Let's Encrypt

4. **定期备份**
- MongoDB数据
- Terraform状态

---

## 📚 相关文档

- [小白部署指南](../../docs/beginner-deploy-guide.md)
- [Terraform使用指南](../../docs/terraform-guide.md)
- [本地MongoDB指南](../../docs/local-mongodb-guide.md)
- [CI/CD指南](../../docs/ci-cd-guide.md)

---

## 🆘 获取帮助

1. 查看日志
```bash
# VM启动日志
gcloud compute instances get-serial-port-output classarranger-vm

# 应用日志
gcloud compute ssh classarranger-vm --command='sudo journalctl -u docker'
```

2. 检查资源
```bash
terraform state list
terraform show
```

3. Terraform文档
- https://www.terraform.io/docs
- https://registry.terraform.io/providers/hashicorp/google/latest/docs

---

**Happy Terraforming! 🚀**

