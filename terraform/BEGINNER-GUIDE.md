# Terraform 新手指南 - ClassArranger

**Created:** 2026-01-23  
**Last Updated:** 2026-01-23  
**Purpose:** 小白也能看懂的 Terraform 完全指南

---

## 🤔 什么是 Terraform？

想象你要盖一栋房子：

**传统方式**（手动操作）：
```
1. 你打电话叫工人来 → gcloud compute instances create
2. 你告诉他们房子要多大 → --machine-type=e2-medium
3. 你指定窗户的位置 → --firewall-rules
4. 每次修改都要重新打电话...
```

**Terraform 方式**（自动化）：
```
1. 你写一个设计图（.tf 文件）
2. Terraform 看图纸自动盖房子
3. 要修改？改图纸，Terraform 自动更新
4. 要拆除？一个命令全部拆掉
```

**核心概念：Infrastructure as Code (基础设施即代码)**
- 📝 用代码定义你的云资源
- 🔄 版本控制（Git）
- 🔍 可审查、可追溯
- 🚀 一键部署、一键销毁

---

## 🏗️ 我们的项目用什么？

### ❌ 不是 Cloud Run

Cloud Run 是无服务器容器平台，我们**没有使用**。

### ✅ 是 Compute Engine VM

**项目架构：**
```
GCP Compute Engine VM (虚拟机)
    ↓
Docker + Docker Compose
    ↓
三个容器：
  - Frontend (React + Nginx)
  - Backend (FastAPI)
  - MongoDB (数据库)
```

**为什么选 VM？**
- ✅ 完全控制服务器
- ✅ 可以运行 MongoDB
- ✅ 成本可预测（固定月费）
- ✅ 适合小型到中型应用

**配置位置：**
```
terraform/vm/         ← 所有配置都在这里
├── main.tf          ← 主要资源定义
├── variables.tf     ← 变量定义
├── outputs.tf       ← 输出值
├── terraform.tfvars ← 你的配置（不提交到Git）
└── BEGINNER-GUIDE.md ← 本文档
```

---

## 📋 文件说明（小白版）

### 1. `main.tf` - 主配置文件

**作用：** 定义要创建的所有资源

**包含：**
```hcl
# 1. VM 虚拟机
resource "google_compute_instance" "app" {
  name         = "classarranger-vm"      # VM 名称
  machine_type = "e2-medium"             # 机器类型（2核4G）
  zone         = "asia-northeast1-a"     # 东京可用区
  # ... 更多配置
}

# 2. 防火墙规则 - HTTP
resource "google_compute_firewall" "http" {
  name = "classarranger-http"
  # 允许所有人访问 80 端口（网页）
}

# 3. 防火墙规则 - API
resource "google_compute_firewall" "api" {
  name = "classarranger-api"
  # 允许所有人访问 8000 端口（后端API）
}

# 4. 静态 IP（可选）
resource "google_compute_address" "static" {
  # 固定的 IP 地址（不会变）
}
```

**比喻：** 这是房子的设计图纸

---

### 2. `variables.tf` - 变量定义

**作用：** 定义可以自定义的参数

**示例：**
```hcl
variable "project_id" {
  description = "GCP 项目 ID"
  type        = string
  # 必填项
}

variable "region" {
  description = "GCP 区域"
  type        = string
  default     = "asia-northeast1"  # 默认值：东京
}

variable "machine_type" {
  description = "VM 机器类型"
  type        = string
  default     = "e2-medium"        # 默认值：2核4G
}
```

**比喻：** 这是空白的选项表，你可以填写自己的选择

---

### 3. `terraform.tfvars` - 你的配置

**作用：** 填写你的实际值

**示例：**
```hcl
project_id = "classarranger-1234567890"  # 你的项目ID
region     = "asia-northeast1"            # 东京
zone       = "asia-northeast1-a"          # 东京A区
machine_type = "e2-medium"                # 2核4G
```

**⚠️ 重要：** 这个文件包含你的项目 ID，**不要提交到 Git**！

**比喻：** 这是你填好的订单

---

### 4. `outputs.tf` - 输出值

**作用：** 部署完成后显示重要信息

**示例：**
```hcl
output "external_ip" {
  description = "VM 的外部 IP 地址"
  value       = google_compute_instance.app.network_interface[0].access_config[0].nat_ip
}

output "frontend_url" {
  description = "前端网址"
  value       = "http://${外部IP}"
}
```

**部署后会显示：**
```
Outputs:

external_ip = "34.146.84.254"
frontend_url = "http://34.146.84.254"
backend_url = "http://34.146.84.254:8000"
ssh_command = "gcloud compute ssh classarranger-vm ..."
```

**比喻：** 这是房子盖好后的地址和钥匙

---

## 🎓 Terraform 核心概念

### 1. State（状态）

**什么是 State？**
- Terraform 记录的"当前状态"
- 保存在 `terraform.tfstate` 文件中
- 记录了你创建的所有资源

**比喻：** 这是施工日志，记录了已经盖好的部分

**⚠️ 非常重要：**
- 不要手动编辑
- 不要删除（除非你知道在做什么）
- 团队合作时要使用远程 backend（高级话题）

---

### 2. Plan（计划）

**什么是 Plan？**
- 预览将要做的更改
- 不会真的执行
- 像"草稿"一样

**命令：**
```bash
terraform plan

# 会显示：
# + 表示要创建
# - 表示要删除
# ~ 表示要修改
```

**比喻：** 施工前给你看设计效果图

---

### 3. Apply（应用）

**什么是 Apply？**
- 真正执行更改
- 会创建/修改/删除资源
- 需要输入 "yes" 确认

**命令：**
```bash
terraform apply

# 会提示：
# Do you want to perform these actions? yes
```

**比喻：** 真的开始盖房子

---

### 4. Destroy（销毁）

**什么是 Destroy？**
- 删除所有资源
- **非常危险！**
- 所有数据会丢失

**命令：**
```bash
terraform destroy

# ⚠️ 警告：这会删除一切！
```

**比喻：** 把房子拆掉

---

## 🚀 实际操作步骤

### 第一步：准备工作

```bash
# 1. 进入 terraform/vm 目录
cd terraform/vm

# 2. 复制配置示例
cp terraform.tfvars.example terraform.tfvars

# 3. 编辑配置文件
vim terraform.tfvars  # 或用你喜欢的编辑器
```

**填写你的信息：**
```hcl
project_id = "你的项目ID"  # ⚠️ 必须改这个！
region     = "asia-northeast1"
zone       = "asia-northeast1-a"
machine_type = "e2-medium"
use_static_ip = false
git_repo_url = "https://github.com/你的用户名/ClassArranger.git"  # ⚠️ 改这个
```

---

### 第二步：初始化

```bash
terraform init
```

**这个命令做什么？**
1. 下载 Google Cloud Provider 插件
2. 初始化工作目录
3. 准备 backend

**输出示例：**
```
Initializing the backend...

Initializing provider plugins...
- Finding hashicorp/google versions matching "~> 5.0"...
- Installing hashicorp/google v5.11.0...

Terraform has been successfully initialized!
```

**只需要运行一次**（除非更新 provider）

---

### 第三步：预览更改

```bash
terraform plan
```

**会显示：**
```
Terraform will perform the following actions:

  # google_compute_instance.app will be created
  + resource "google_compute_instance" "app" {
      + name         = "classarranger-vm"
      + machine_type = "e2-medium"
      + zone         = "asia-northeast1-a"
      ...
    }

  # google_compute_firewall.http will be created
  + resource "google_compute_firewall" "http" {
      + name = "classarranger-http"
      ...
    }

Plan: 4 to add, 0 to change, 0 to destroy.
```

**解读：**
- `Plan: 4 to add` - 将创建 4 个资源
- `0 to change` - 不修改现有资源
- `0 to destroy` - 不删除资源

---

### 第四步：应用更改

```bash
terraform apply
```

**过程：**
```
1. 再次显示 plan
2. 询问确认：Do you want to perform these actions?
3. 输入 "yes"
4. 开始创建资源
5. 显示进度
6. 完成！
```

**输出示例：**
```
Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes  ← 输入这个

google_compute_firewall.http: Creating...
google_compute_firewall.api: Creating...
google_compute_firewall.http: Creation complete after 5s
google_compute_firewall.api: Creation complete after 5s
google_compute_instance.app: Creating...
google_compute_instance.app: Still creating... [10s elapsed]
google_compute_instance.app: Still creating... [20s elapsed]
google_compute_instance.app: Creation complete after 25s

Apply complete! Resources: 4 added, 0 changed, 0 destroyed.

Outputs:

external_ip = "34.146.84.254"
frontend_url = "http://34.146.84.254"
backend_url = "http://34.146.84.254:8000"
```

**⏰ 需要时间：** 约 3-5 分钟

---

### 第五步：查看输出

```bash
terraform output
```

**会显示：**
```
external_ip = "34.146.84.254"
frontend_url = "http://34.146.84.254"
backend_url = "http://34.146.84.254:8000"
ssh_command = "gcloud compute ssh classarranger-vm --zone=asia-northeast1-a"
```

**复制这些信息！** 你需要用它们访问应用。

---

## 🔧 常用命令

### 查看状态
```bash
# 查看当前资源
terraform show

# 列出所有资源
terraform state list

# 查看特定资源
terraform state show google_compute_instance.app
```

---

### 更新配置

**场景：** 你想把机器类型从 e2-medium 改成 e2-small

```bash
# 1. 编辑 terraform.tfvars
vim terraform.tfvars

# 修改：
# machine_type = "e2-small"

# 2. 查看会改什么
terraform plan

# 会显示：
# ~ google_compute_instance.app will be updated in-place
#   ~ machine_type = "e2-medium" -> "e2-small"

# 3. 应用更改
terraform apply
```

---

### 格式化代码

```bash
# 自动格式化所有 .tf 文件
terraform fmt

# 递归格式化
terraform fmt -recursive
```

---

### 验证配置

```bash
# 检查语法是否正确
terraform validate

# 输出：
# Success! The configuration is valid.
```

---

## 🆘 常见问题

### Q1: terraform init 失败

**错误：**
```
Error: Failed to query available provider packages
```

**解决：**
```bash
# 1. 检查网络连接
ping registry.terraform.io

# 2. 清理缓存重试
rm -rf .terraform
rm .terraform.lock.hcl
terraform init
```

---

### Q2: 权限错误

**错误：**
```
Error: Error creating instance: googleapi: Error 403
```

**解决：**
```bash
# 1. 确认已登录
gcloud auth list

# 2. 重新认证
gcloud auth application-default login

# 3. 确认项目
gcloud config get-value project

# 4. 启用 API
gcloud services enable compute.googleapis.com
```

---

### Q3: terraform apply 卡住

**症状：**
```
google_compute_instance.app: Still creating... [5m0s elapsed]
google_compute_instance.app: Still creating... [10m0s elapsed]
```

**可能原因：**
- 网络问题
- GCP 配额不足
- 区域不可用

**解决：**
```bash
# 1. Ctrl+C 取消
# 2. 查看 GCP Console 的 VM instances 页面
# 3. 如果 VM 已创建，导入状态：
terraform import google_compute_instance.app classarranger-vm
```

---

### Q4: 如何删除单个资源

**场景：** 只想删除防火墙规则，保留 VM

```bash
# 1. 从 Terraform 状态移除（但不删除实际资源）
terraform state rm google_compute_firewall.http

# 2. 从代码中删除或注释掉相应的 resource 块

# 3. 重新 apply
terraform apply
```

---

### Q5: terraform.tfstate 丢失了

**⚠️ 严重问题！**

**恢复方法：**
```bash
# 如果有备份
cp terraform.tfstate.backup terraform.tfstate

# 如果没有备份，手动导入所有资源：
terraform import google_compute_instance.app classarranger-vm
terraform import google_compute_firewall.http classarranger-http
terraform import google_compute_firewall.api classarranger-api
# ... 所有资源
```

**预防措施：**
```bash
# 1. 定期备份
cp terraform.tfstate terraform.tfstate.backup

# 2. 使用远程 backend（推荐生产环境）
# 在 main.tf 添加：
terraform {
  backend "gcs" {
    bucket = "your-terraform-state-bucket"
    prefix = "classarranger"
  }
}
```

---

## 💰 成本估算

### 当前配置成本（东京区域）

**VM (e2-medium):**
```
2 vCPU, 4GB RAM
月费用：约 $27
24/7 运行
```

**网络流量:**
```
出站流量（中国大陆）：约 $0.12/GB
入站流量：免费
估计：$2-5/月
```

**磁盘:**
```
20GB 标准持久化磁盘
月费用：约 $2
```

**静态 IP（如果启用）:**
```
月费用：约 $3
```

**总计：约 $27-37/月**

---

### 降低成本的方法

#### 1. 使用更小的机器
```hcl
# terraform.tfvars
machine_type = "e2-small"  # 约 $14/月（省 $13）
```

**⚠️ 注意：** 可能影响性能

---

#### 2. 定时启停 VM

```bash
# 工作日启动
gcloud compute instances start classarranger-vm --zone=asia-northeast1-a

# 夜间停止
gcloud compute instances stop classarranger-vm --zone=asia-northeast1-a

# 停止时不收取 CPU/内存费用，只收取磁盘费用
# 节省：约 $20/月
```

**使用 Cron 自动化：**
```bash
# 每天 9:00 启动
0 9 * * 1-5 gcloud compute instances start classarranger-vm --zone=asia-northeast1-a

# 每天 18:00 停止
0 18 * * 1-5 gcloud compute instances stop classarranger-vm --zone=asia-northeast1-a
```

---

#### 3. 使用抢占式 VM

```hcl
# main.tf
resource "google_compute_instance" "app" {
  # ... 其他配置 ...
  
  scheduling {
    preemptible       = true
    automatic_restart = false
  }
}
```

**优势：** 省 80% 费用（约 $5/月）
**劣势：** 可能随时被中断（最多 24 小时）

---

## 📚 学习资源

### 官方文档
- [Terraform 官方文档](https://www.terraform.io/docs)
- [GCP Provider 文档](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Terraform 教程](https://learn.hashicorp.com/terraform)

### 推荐阅读
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [Terraform: Up & Running](https://www.terraformupandrunning.com/)

### 视频教程
- [Terraform Course - FreeCodeCamp](https://www.youtube.com/watch?v=SLB_c_ayRMo)
- [HashiCorp Terraform 官方频道](https://www.youtube.com/c/HashiCorp)

---

## 🎯 下一步

### 你已经学会了：
- ✅ 什么是 Terraform
- ✅ 我们的项目用什么（VM）
- ✅ 文件结构和作用
- ✅ 基本命令操作
- ✅ 常见问题解决

### 进阶学习：
1. **Terraform Modules** - 模块化配置
2. **Remote Backend** - 团队协作
3. **Terraform Cloud** - 自动化 CI/CD
4. **Multi-environment** - 多环境管理

---

## 📝 速查表

```bash
# 初始化（只需一次）
terraform init

# 预览更改
terraform plan

# 应用更改
terraform apply

# 销毁所有资源（危险！）
terraform destroy

# 查看输出
terraform output

# 查看状态
terraform show

# 格式化代码
terraform fmt

# 验证配置
terraform validate

# 列出资源
terraform state list

# 查看特定资源
terraform state show <resource>

# 刷新状态
terraform refresh
```

---

## ✅ 检查清单

在运行 `terraform apply` 之前：

- [ ] 已安装 Terraform
- [ ] 已安装 gcloud CLI
- [ ] 已认证 GCP（`gcloud auth login`）
- [ ] 已设置项目（`gcloud config set project`）
- [ ] 已编辑 `terraform.tfvars`
- [ ] 已运行 `terraform init`
- [ ] 已运行 `terraform plan`（查看将要创建什么）
- [ ] 确认费用在预算内
- [ ] 准备好等待 3-5 分钟

---

**🎉 恭喜！你已经掌握了 Terraform 基础！**

**记住：**
1. 先 `plan`，再 `apply`
2. 不要随意 `destroy`
3. 定期备份 `terraform.tfstate`
4. 有问题先看文档，再问 AI

**祝你部署顺利！🚀**

