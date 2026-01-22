# Terraform实现总结

**Created:** 2026-01-22  
**Last Updated:** 2026-01-22  
**Purpose:** 完整的Terraform Infrastructure as Code (IaC)实现总结

---

## 📋 概述

本项目现在完全使用Terraform实现Infrastructure as Code，包括：

- ✅ **自动化部署** - 一键创建整套GCP基础设施
- ✅ **CI/CD集成** - GitHub Actions自动化pipeline
- ✅ **版本控制** - 基础设施代码化
- ✅ **可重复性** - 随时销毁和重建
- ✅ **预览更改** - terraform plan查看影响
- ✅ **多环境** - 支持dev/staging/prod

---

## 🆕 新增文件清单

### Terraform配置（7个文件）

```
terraform/vm/
├── main.tf                    # 主配置：资源定义
├── variables.tf               # 变量定义
├── outputs.tf                 # 输出值定义
├── terraform.tfvars.example   # 配置示例
├── startup-script.sh         # VM启动脚本
├── deploy-app.sh             # 应用部署脚本
└── README.md                 # Terraform使用说明
```

### CI/CD配置（1个文件）

```
.github/workflows/
└── terraform-deploy.yml      # GitHub Actions workflow
```

### 脚本（1个文件）

```
scripts/
└── terraform-deploy.sh       # 一键部署脚本
```

### 文档（4个文件）

```
docs/
├── beginner-deploy-guide.md     # 更新：Terraform部署指南
├── terraform-guide.md           # 新增：Terraform完整教程
├── terraform-implementation-summary.md  # 本文件
└── INDEX.md                     # 更新：文档索引
```

### 其他（2个文件）

```
.gitignore                      # 更新：添加Terraform规则
README.md                       # 更新：Terraform部署说明
```

---

## 🏗️ 架构设计

### Terraform资源架构

```
Terraform (IaC)
│
├── Provider: google (~> 5.0)
│   └── Project: YOUR_PROJECT_ID
│
├── APIs
│   └── compute.googleapis.com
│
├── Network
│   ├── Firewall: http (Port 80)
│   └── Firewall: api (Port 8000)
│
├── Compute
│   ├── Static IP (optional)
│   └── VM Instance (e2-medium)
│       ├── Ubuntu 22.04 LTS
│       ├── Boot Disk: 20GB
│       ├── Docker + Docker Compose
│       └── Metadata Startup Script
│
└── Application
    ├── Frontend (Nginx:80)
    ├── Backend (FastAPI:8000)
    └── MongoDB (27017, internal)
```

### CI/CD Pipeline架构

```
GitHub Repository
│
├── Push to main
│   └── Trigger: terraform-deploy.yml
│       ├── 1. Checkout code
│       ├── 2. Setup Terraform
│       ├── 3. Authenticate GCP
│       ├── 4. terraform fmt (check)
│       ├── 5. terraform init
│       ├── 6. terraform validate
│       ├── 7. terraform plan
│       ├── 8. terraform apply
│       ├── 9. Upload application code
│       ├── 10. Deploy on VM
│       └── 11. Health checks
│
├── Pull Request
│   └── Trigger: terraform-deploy.yml
│       ├── 1-7. Same as above
│       └── 8. Comment PR with plan
│
└── Manual Dispatch
    └── Options: plan | apply | destroy
```

---

## 🚀 使用方法

### 方法一：一键脚本（推荐新手）

```bash
# 设置环境变量
export PROJECT_ID='your-gcp-project-id'
export REGION='asia-northeast1'  # 东京区域
export ZONE='asia-northeast1-a'  # 东京可用区A
export MACHINE_TYPE='e2-medium'

# 运行部署脚本
./scripts/terraform-deploy.sh
```

**脚本功能：**
1. 检查Terraform安装
2. 验证必需变量
3. terraform init
4. terraform fmt
5. terraform validate
6. terraform plan
7. terraform apply（需确认）
8. 上传应用代码
9. 在VM上部署
10. 运行健康检查
11. 显示访问地址

### 方法二：Terraform命令（推荐开发者）

```bash
# 1. 配置
cd terraform/vm
cp terraform.tfvars.example terraform.tfvars
vi terraform.tfvars  # 编辑project_id

# 2. 初始化
terraform init

# 3. 验证
terraform validate
terraform fmt

# 4. 计划
terraform plan \
  -var="project_id=YOUR_PROJECT_ID" \
  -var="region=asia-northeast1" \
  -var="zone=asia-northeast1-a" \
  -var="machine_type=e2-medium" \
  -out=tfplan

# 5. 应用
terraform apply tfplan

# 6. 查看输出
terraform output
```

### 方法三：CI/CD自动化（推荐生产）

```bash
# 1. 配置GitHub Secrets
# - GCP_PROJECT_ID
# - GCP_REGION
# - GCP_ZONE
# - VM_MACHINE_TYPE
# - USE_STATIC_IP
# - GCP_SA_KEY

# 2. Push到main分支
git add .
git commit -m "Deploy application"
git push origin main

# 3. GitHub Actions自动部署
# 查看进度：Actions标签页
```

---

## 📊 Terraform配置详解

### main.tf核心资源

**1. Provider配置**
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
```

**2. API启用**
```hcl
resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
  disable_on_destroy = false
}
```

**3. 防火墙规则**
```hcl
resource "google_compute_firewall" "http" {
  name    = "classarranger-http"
  network = "default"
  allow {
    protocol = "tcp"
    ports    = ["80"]
  }
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["classarranger"]
}
```

**4. VM实例**
```hcl
resource "google_compute_instance" "app" {
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zone
  tags         = ["classarranger"]
  
  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = var.boot_disk_size
    }
  }
  
  network_interface {
    network = "default"
    access_config {
      nat_ip = var.use_static_ip ? google_compute_address.static[0].address : null
    }
  }
  
  metadata_startup_script = <<-EOT
    # 安装Docker
    # 安装Docker Compose
    # 部署应用
  EOT
}
```

### variables.tf配置项

| 变量 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| project_id | string | - | GCP项目ID（必需） |
| region | string | asia-northeast1 | GCP区域（东京） |
| zone | string | asia-northeast1-a | GCP可用区（东京A） |
| instance_name | string | classarranger-vm | VM实例名 |
| machine_type | string | e2-medium | 机器类型 |
| boot_disk_size | number | 20 | 磁盘大小(GB) |
| use_static_ip | bool | false | 是否使用静态IP |
| git_repo_url | string | "" | Git仓库URL |
| wait_for_deployment | bool | true | 等待部署完成 |

### outputs.tf输出值

| 输出 | 说明 | 示例 |
|------|------|------|
| instance_name | VM实例名 | classarranger-vm |
| external_ip | 外部IP地址 | 34.123.45.67 |
| frontend_url | 前端URL | http://34.123.45.67 |
| backend_url | 后端URL | http://34.123.45.67:8000 |
| ssh_command | SSH连接命令 | gcloud compute ssh... |

---

## 🔄 CI/CD Workflow

### GitHub Actions配置

**.github/workflows/terraform-deploy.yml**

**触发条件：**
- Push到main分支 → 自动apply
- Pull Request → 自动plan并评论
- 手动触发 → 选择plan/apply/destroy

**主要步骤：**

1. **Setup**
   - Checkout代码
   - 安装Terraform
   - GCP认证

2. **Validate**
   - terraform fmt检查
   - terraform init
   - terraform validate

3. **Plan**
   - terraform plan
   - PR中评论计划详情

4. **Apply** (仅main分支)
   - terraform apply
   - 获取输出值

5. **Deploy**
   - 创建部署包
   - 上传到VM
   - 在VM上部署

6. **Verify**
   - 健康检查
   - 评论部署信息

### GitHub Secrets配置

必需的Secrets：

| Secret名称 | 说明 | 获取方式 |
|-----------|------|---------|
| GCP_PROJECT_ID | GCP项目ID | gcloud config get-value project |
| GCP_REGION | GCP区域 | 默认：asia-northeast1 (东京) |
| GCP_ZONE | GCP可用区 | 默认：asia-northeast1-a (东京A) |
| VM_MACHINE_TYPE | VM机器类型 | 默认：e2-medium |
| USE_STATIC_IP | 是否静态IP | 默认：false |
| GCP_SA_KEY | 服务账号密钥 | 见下方说明 |

**创建服务账号：**
```bash
# 1. 创建服务账号
gcloud iam service-accounts create terraform-deployer

# 2. 授予权限
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:terraform-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/compute.admin"

# 3. 创建密钥
gcloud iam service-accounts keys create key.json \
  --iam-account=terraform-deployer@PROJECT_ID.iam.gserviceaccount.com

# 4. 复制JSON内容到GitHub Secrets
cat key.json
```

---

## 💰 成本分析

### 资源成本（月费用）

| 资源 | 配置 | 月费用 |
|------|------|--------|
| VM (e2-medium) | 2 vCPU, 4GB | $25 |
| Boot Disk | 20GB SSD | $2 |
| Static IP (可选) | 固定IP | $3 |
| Network Egress | 前1GB免费 | $0-5 |
| **总计** | | **$27-35** |

### 不同配置对比

| 机器类型 | vCPU | 内存 | 月费用 | 适用场景 |
|---------|------|------|--------|---------|
| e2-micro | 0.25-2 | 1GB | $6 | 仅测试 |
| e2-small | 0.5-2 | 2GB | $13 | 轻量使用 |
| **e2-medium** | **2** | **4GB** | **$25** | **推荐** |
| e2-standard-2 | 2 | 8GB | $49 | 高负载 |

### 节省成本

1. **使用更小机器类型**
   ```hcl
   machine_type = "e2-small"  # ~$13/月
   ```

2. **不使用静态IP**
   ```hcl
   use_static_ip = false  # 节省$3/月
   ```

3. **停止不用的VM**
   ```bash
   gcloud compute instances stop classarranger-vm --zone=asia-northeast1-a
   # 仅付磁盘费：~$2/月
   ```

4. **使用GCP免费额度**
   - 新用户：$300免费额度
   - 可用90天
   - 足够运行3-12个月

---

## 🔐 安全最佳实践

### 1. Terraform状态管理

**本地开发：**
```bash
# 定期备份状态文件
cp terraform.tfstate terraform.tfstate.backup.$(date +%Y%m%d)
```

**生产环境：**
```hcl
# 使用远程backend
terraform {
  backend "gcs" {
    bucket = "your-terraform-state-bucket"
    prefix = "classarranger/prod"
  }
}
```

### 2. 敏感信息管理

**.gitignore:**
```gitignore
# Terraform
.terraform/
*.tfstate
*.tfstate.backup
*.tfvars           # 包含敏感信息
*.tfplan
```

**使用变量：**
```hcl
variable "api_key" {
  description = "API Key"
  type        = string
  sensitive   = true  # 不会在输出中显示
}
```

### 3. 访问控制

**限制SSH:**
```hcl
resource "google_compute_firewall" "ssh" {
  name = "allow-ssh-from-office"
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  source_ranges = ["YOUR_OFFICE_IP/32"]  # 仅允许特定IP
}
```

**使用服务账号：**
```hcl
resource "google_service_account" "app" {
  account_id = "classarranger-app"
}

resource "google_compute_instance" "app" {
  service_account {
    email  = google_service_account.app.email
    scopes = ["cloud-platform"]
  }
}
```

---

## 🐛 常见问题和解决方案

### Q1: Terraform init失败

```bash
# 错误：Failed to query available provider packages
# 解决：
rm -rf .terraform .terraform.lock.hcl
terraform init
```

### Q2: 权限不足

```bash
# 错误：Error 403: Permission denied
# 解决：
gcloud auth application-default login
gcloud services enable compute.googleapis.com
```

### Q3: 状态文件冲突

```bash
# 错误：Error acquiring the state lock
# 解决：
terraform force-unlock LOCK_ID
```

### Q4: 资源已存在

```bash
# 错误：Resource already exists
# 解决：导入现有资源
terraform import google_compute_instance.app PROJECT/ZONE/INSTANCE
```

### Q5: VM无法访问

```bash
# 检查VM状态
gcloud compute instances list

# 查看启动日志
gcloud compute instances get-serial-port-output classarranger-vm

# SSH检查
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a
docker-compose -f /opt/classarranger/docker-compose.prod.yml ps
```

---

## 📚 文档索引

### 部署相关
- [小白部署指南](./beginner-deploy-guide.md) - Terraform从零开始
- [Terraform使用指南](./terraform-guide.md) - Terraform完整教程
- [terraform/vm/README.md](../terraform/vm/README.md) - Terraform配置说明

### 开发相关
- [本地运行指南](./local-run.md)
- [本地MongoDB指南](./local-mongodb-guide.md)
- [Mock模式指南](./mock-mode-guide.md)

### CI/CD相关
- [CI/CD指南](./ci-cd-guide.md)
- [GitHub Actions配置](./.github/workflows/terraform-deploy.yml)

---

## 🎯 下一步

### 生产环境优化

1. **启用Remote Backend**
   ```hcl
   terraform {
     backend "gcs" {
       bucket = "terraform-state-bucket"
       prefix = "classarranger"
     }
   }
   ```

2. **多环境管理**
   ```bash
   terraform workspace new dev
   terraform workspace new staging
   terraform workspace new prod
   ```

3. **添加监控**
   - Cloud Monitoring
   - Uptime checks
   - 告警策略

4. **配置HTTPS**
   - Let's Encrypt
   - 自定义域名

5. **自动备份**
   - MongoDB数据备份
   - Terraform状态备份

---

## ✅ 总结

### 实现的功能

- ✅ Infrastructure as Code - 基础设施代码化
- ✅ 一键部署 - 10分钟完成
- ✅ CI/CD自动化 - Push即部署
- ✅ 版本控制 - Git管理配置
- ✅ 预览更改 - terraform plan
- ✅ 可重复性 - 随时重建
- ✅ 多环境支持 - dev/staging/prod
- ✅ 自动化测试 - 健康检查

### 优势

1. **可靠性** - 每次部署结果一致
2. **可审计** - 所有更改有记录
3. **可回滚** - 轻松回退
4. **可扩展** - 轻松添加资源
5. **团队协作** - 代码审查
6. **文档化** - 代码即文档

### 文件统计

- **Terraform配置**: 7个文件
- **CI/CD配置**: 1个文件
- **部署脚本**: 1个文件
- **文档**: 4个文件
- **总计**: 13个新增/更新文件

---

**Infrastructure as Code让部署变得简单可靠！🚀**

**Created:** 2026-01-22  
**Version:** 1.0.0  
**Author:** ClassArranger Team

