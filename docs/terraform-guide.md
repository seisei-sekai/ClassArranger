# Terraform使用指南

**Created:** 2026-01-22  
**Last Updated:** 2026-01-22  
**Purpose:** Terraform Infrastructure as Code (IaC) 完整使用指南

---

## 📋 目录

1. [Terraform简介](#terraform简介)
2. [项目结构](#项目结构)
3. [快速开始](#快速开始)
4. [核心概念](#核心概念)
5. [常用命令](#常用命令)
6. [配置说明](#配置说明)
7. [工作流程](#工作流程)
8. [最佳实践](#最佳实践)

---

## Terraform简介

### 什么是Terraform？

Terraform是HashiCorp开发的Infrastructure as Code (IaC)工具，让你可以：

- 📝 **用代码定义基础设施** - 使用HCL语言描述资源
- 🔄 **自动化管理** - 一键创建/更新/删除资源
- 📊 **版本控制** - 像管理代码一样管理基础设施
- 🔍 **预览更改** - 在应用前查看将要发生的变化
- 🌐 **多云支持** - GCP、AWS、Azure等

### 为什么使用Terraform？

**对比手动操作:**

| 操作 | 手动 | Terraform |
|------|------|-----------|
| 创建VM | 点击15次+ | 一行命令 |
| 重复性 | 容易出错 | 完全一致 |
| 文档化 | 需要手写 | 代码即文档 |
| 版本控制 | 困难 | Git管理 |
| 回滚 | 手动重建 | 简单回滚 |
| 团队协作 | 困难 | 代码审查 |

---

## 项目结构

```
ClassArranger/
├── terraform/
│   └── vm/                    # VM部署配置
│       ├── main.tf           # 主配置文件（资源定义）
│       ├── variables.tf      # 变量定义
│       ├── outputs.tf        # 输出值定义
│       ├── terraform.tfvars.example  # 配置示例
│       ├── startup-script.sh # VM启动脚本
│       └── deploy-app.sh     # 应用部署脚本
│
├── .github/workflows/
│   └── terraform-deploy.yml  # CI/CD配置
│
└── scripts/
    └── terraform-deploy.sh   # 一键部署脚本
```

---

## 快速开始

### 1. 安装Terraform

```bash
# Mac
brew install terraform

# Windows
choco install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### 2. 配置GCP

```bash
# 登录
gcloud auth login
gcloud auth application-default login

# 设置项目
gcloud config set project YOUR_PROJECT_ID
```

### 3. 初始化Terraform

```bash
cd terraform/vm
terraform init
```

### 4. 配置变量

```bash
cp terraform.tfvars.example terraform.tfvars
# 编辑terraform.tfvars，填入你的project_id
```

### 5. 部署

```bash
# 查看执行计划
terraform plan

# 应用更改
terraform apply

# 查看输出
terraform output
```

---

## 核心概念

### 1. Provider（提供商）

Provider是Terraform与云服务商交互的插件。

```hcl
provider "google" {
  project = var.project_id
  region  = var.region
}
```

### 2. Resource（资源）

Resource是你想要创建的基础设施组件。

```hcl
resource "google_compute_instance" "app" {
  name         = "classarranger-vm"
  machine_type = "e2-medium"
  zone         = "asia-northeast1-a"  # 东京可用区A
  
  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
    }
  }
  
  network_interface {
    network = "default"
    access_config {
      # Ephemeral IP
    }
  }
}
```

### 3. Variable（变量）

Variable让配置可重用和可定制。

```hcl
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "machine_type" {
  description = "VM machine type"
  type        = string
  default     = "e2-medium"
}
```

### 4. Output（输出）

Output显示资源的属性值。

```hcl
output "external_ip" {
  description = "VM external IP"
  value       = google_compute_instance.app.network_interface[0].access_config[0].nat_ip
}
```

### 5. State（状态）

State文件记录了Terraform管理的资源当前状态。

```bash
# 状态文件
terraform.tfstate
terraform.tfstate.backup

# ⚠️ 非常重要，需要备份！
```

### 6. Data Source（数据源）

Data Source用于读取外部数据。

```hcl
data "template_file" "startup_script" {
  template = file("${path.module}/startup-script.sh")
  
  vars = {
    project_id = var.project_id
  }
}
```

---

## 常用命令

### 基础命令

```bash
# 初始化（下载provider插件）
terraform init

# 验证配置语法
terraform validate

# 格式化代码
terraform fmt

# 生成执行计划
terraform plan

# 应用更改
terraform apply

# 销毁资源
terraform destroy
```

### 状态管理

```bash
# 查看当前状态
terraform show

# 列出所有资源
terraform state list

# 查看特定资源
terraform state show google_compute_instance.app

# 移除资源（不销毁）
terraform state rm google_compute_instance.app

# 刷新状态
terraform refresh
```

### 输出管理

```bash
# 显示所有输出
terraform output

# 显示特定输出
terraform output external_ip

# JSON格式
terraform output -json

# 用于脚本
EXTERNAL_IP=$(terraform output -raw external_ip)
```

### 工作区管理

```bash
# 创建工作区
terraform workspace new dev
terraform workspace new prod

# 切换工作区
terraform workspace select dev

# 查看当前工作区
terraform workspace show

# 列出所有工作区
terraform workspace list
```

### 高级命令

```bash
# 导入现有资源
terraform import google_compute_instance.app projects/PROJECT_ID/zones/ZONE/instances/INSTANCE_NAME

# 标记资源需要重建
terraform taint google_compute_instance.app

# 取消标记
terraform untaint google_compute_instance.app

# 生成资源依赖图
terraform graph | dot -Tpng > graph.png

# 查看provider文档
terraform providers
```

---

## 配置说明

### main.tf

主配置文件，定义所有资源。

```hcl
# Provider配置
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

# 资源定义
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

resource "google_compute_instance" "app" {
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zone
  
  # ... 更多配置
}
```

### variables.tf

变量定义，让配置灵活可复用。

```hcl
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "machine_type" {
  description = "VM machine type"
  type        = string
  default     = "e2-medium"
  
  validation {
    condition     = contains(["e2-micro", "e2-small", "e2-medium", "e2-standard-2"], var.machine_type)
    error_message = "Invalid machine type"
  }
}
```

### terraform.tfvars

变量值，覆盖默认值。

```hcl
project_id     = "classarranger-app-123"
region         = "asia-northeast1"  # 东京区域
zone           = "asia-northeast1-a"  # 东京可用区A
machine_type   = "e2-medium"
use_static_ip  = false
```

⚠️ **注意:** terraform.tfvars包含敏感信息，不要提交到Git！

### outputs.tf

输出定义，显示有用信息。

```hcl
output "external_ip" {
  description = "VM external IP address"
  value       = google_compute_instance.app.network_interface[0].access_config[0].nat_ip
}

output "frontend_url" {
  description = "Frontend URL"
  value       = "http://${google_compute_instance.app.network_interface[0].access_config[0].nat_ip}"
}
```

---

## 工作流程

### 标准开发流程

```
1. 编写配置 (Write)
   ├── 定义资源
   ├── 设置变量
   └── 配置输出

2. 初始化 (Init)
   └── terraform init

3. 计划 (Plan)
   ├── terraform plan
   └── 审查更改

4. 应用 (Apply)
   ├── terraform apply
   └── 确认执行

5. 验证 (Verify)
   ├── terraform output
   ├── 测试应用
   └── 检查资源

6. 维护 (Maintain)
   ├── 更新配置
   ├── terraform apply
   └── 监控状态
```

### Pull Request流程

```
1. 创建分支
   git checkout -b feature/update-vm

2. 修改配置
   vi terraform/vm/main.tf

3. 验证
   terraform validate
   terraform fmt

4. 提交PR
   git push origin feature/update-vm

5. 自动Plan
   GitHub Actions自动运行terraform plan
   并在PR中评论结果

6. 代码审查
   团队审查terraform plan输出

7. 合并
   合并到main后自动apply
```

### 多环境管理

```bash
# 开发环境
terraform workspace new dev
terraform apply -var-file=dev.tfvars

# 测试环境
terraform workspace new staging
terraform apply -var-file=staging.tfvars

# 生产环境
terraform workspace new prod
terraform apply -var-file=prod.tfvars
```

---

## 最佳实践

### 1. 版本控制

✅ **应该提交:**
- `*.tf` - Terraform配置
- `.terraform.lock.hcl` - Provider版本锁定

❌ **不应该提交:**
- `terraform.tfvars` - 包含敏感信息
- `.terraform/` - Provider插件
- `*.tfstate` - 状态文件
- `*.tfstate.backup` - 状态备份

**.gitignore示例:**
```gitignore
# Terraform
.terraform/
*.tfstate
*.tfstate.backup
*.tfvars
.terraform.lock.hcl
*.tfplan
```

### 2. 状态文件管理

**本地开发:**
```bash
# 定期备份
cp terraform.tfstate terraform.tfstate.backup.$(date +%Y%m%d)
```

**生产环境:**
```hcl
# 使用远程backend
terraform {
  backend "gcs" {
    bucket = "your-terraform-state"
    prefix = "classarranger/prod"
  }
}
```

### 3. 变量管理

```hcl
# 使用描述性变量名
variable "vm_machine_type" {  # ✅ 好
  # ...
}

variable "mt" {  # ❌ 不好
  # ...
}

# 添加描述和验证
variable "machine_type" {
  description = "VM machine type (e2-micro, e2-small, e2-medium)"
  type        = string
  default     = "e2-medium"
  
  validation {
    condition     = contains(["e2-micro", "e2-small", "e2-medium"], var.machine_type)
    error_message = "Invalid machine type"
  }
}

# 使用sensitive标记敏感变量
variable "api_key" {
  description = "API Key"
  type        = string
  sensitive   = true
}
```

### 4. 模块化

```hcl
# 将可重用配置提取为模块
module "vm" {
  source = "./modules/compute-vm"
  
  project_id   = var.project_id
  machine_type = var.machine_type
  zone         = var.zone
}
```

### 5. 资源命名

```hcl
# 使用一致的命名约定
resource "google_compute_instance" "app" {  # ✅
  name = "classarranger-vm-${terraform.workspace}"
}

resource "google_compute_instance" "x" {  # ❌
  name = "vm1"
}
```

### 6. 注释和文档

```hcl
# 添加注释解释复杂逻辑
resource "google_compute_instance" "app" {
  # 使用e2-medium提供足够的性能
  # 同时保持成本可控（约$25/月）
  machine_type = var.machine_type
  
  # 启动脚本安装Docker和Docker Compose
  metadata_startup_script = templatefile(
    "${path.module}/startup-script.sh",
    {
      project_id = var.project_id
    }
  )
}
```

### 7. 依赖管理

```hcl
# 显式声明依赖
resource "google_compute_instance" "app" {
  # ...
  
  depends_on = [
    google_compute_firewall.http,
    google_compute_firewall.api
  ]
}

# 使用lifecycle管理
resource "google_compute_instance" "app" {
  # ...
  
  lifecycle {
    create_before_destroy = true
    prevent_destroy       = false
    ignore_changes        = [metadata]
  }
}
```

### 8. 安全实践

```hcl
# 使用Secret Manager
data "google_secret_manager_secret_version" "api_key" {
  secret = "api-key"
}

# 限制访问
resource "google_compute_firewall" "ssh" {
  name = "allow-ssh-from-office"
  
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  
  # 仅允许办公室IP
  source_ranges = ["203.0.113.0/24"]
}

# 使用服务账号
resource "google_compute_instance" "app" {
  service_account {
    email  = google_service_account.app.email
    scopes = ["cloud-platform"]
  }
}
```

---

## 🐛 常见问题

### Q1: Terraform init失败

```bash
# 错误：Failed to query available provider packages
# 解决：删除.terraform目录重试
rm -rf .terraform
terraform init
```

### Q2: 状态锁定

```bash
# 错误：Error acquiring the state lock
# 原因：另一个terraform进程正在运行
# 解决：等待完成或强制解锁（谨慎！）
terraform force-unlock LOCK_ID
```

### Q3: 资源已存在

```bash
# 错误：Resource already exists
# 解决：导入现有资源
terraform import google_compute_instance.app PROJECT/ZONE/INSTANCE_NAME
```

### Q4: 配置漂移

```bash
# 错误：资源被手动修改
# 解决：刷新状态
terraform refresh
terraform plan  # 查看差异
terraform apply  # 恢复为代码定义的状态
```

---

## 📚 相关资源

- [Terraform官方文档](https://www.terraform.io/docs)
- [GCP Provider文档](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Terraform Registry](https://registry.terraform.io/)
- [小白部署指南](./beginner-deploy-guide.md)
- [CI/CD指南](./ci-cd-guide.md)

---

**Infrastructure as Code的力量！🚀**

