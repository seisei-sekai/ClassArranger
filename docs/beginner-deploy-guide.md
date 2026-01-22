# 小白部署指南 - Terraform自动化部署

**Created:** 2026-01-22  
**Last Updated:** 2026-01-22  
**Purpose:** 使用Terraform实现Infrastructure as Code (IaC)，自动化部署到GCP

---

## 📋 目录

1. [准备工作](#准备工作)
2. [第一步：安装工具](#第一步安装工具)
3. [第二步：准备GCP环境](#第二步准备gcp环境)
4. [第三步：配置Terraform](#第三步配置terraform)
5. [第四步：部署应用](#第四步部署应用)
6. [第五步：CI/CD自动化](#第五步cicd自动化)
7. [常见问题](#常见问题)

---

## 准备工作

### 你需要准备：

- ✅ GCP账号（已绑定信用卡）
- ✅ 一台电脑（Mac/Windows/Linux都可以）
- ✅ 稳定的网络连接
- ✅ 30分钟的时间

### 什么是Terraform？

**Terraform** 是一个Infrastructure as Code (IaC)工具，可以：
- 📝 用代码定义基础设施
- 🔄 自动化部署和管理
- 📊 版本控制和回滚
- 🔍 预览更改（Plan）
- 🚀 一键部署（Apply）

### 费用说明：

**GCP Compute Engine VM (e2-medium) - 东京区域:**
- 配置：2 vCPU, 4GB RAM, 20GB磁盘
- 费用：约 $27/月（东京区域略高于美国）
- 💡 可以使用更小的机器类型降低成本
- 📍 东京区域延迟更低，适合亚洲用户

**免费试用:**
- GCP新用户有 $300 免费额度，可用90天
- 足够运行3-12个月

---

## 第一步：安装工具

### 1.1 安装Google Cloud CLI

**Mac（使用Homebrew）:**
```bash
brew install google-cloud-sdk
```

**Windows:**
1. 下载安装器：https://cloud.google.com/sdk/docs/install
2. 运行安装程序

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 1.2 安装Terraform

**Mac:**
```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

**Windows:**
```bash
choco install terraform
```

**Linux:**
```bash
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

**验证安装:**
```bash
terraform version
# 应该显示: Terraform v1.6.0 或更高版本
```

### 1.3 安装Git（如果没有）

**Mac:**
```bash
brew install git
```

**Windows/Linux:**
https://git-scm.com/downloads

✅ **工具安装完成！**

---

## 第二步：准备GCP环境

### 2.1 登录GCP

```bash
# 登录GCP
gcloud auth login

# 设置应用默认凭据（Terraform需要）
gcloud auth application-default login
```

### 2.2 创建GCP项目

```bash
# 创建项目（项目ID必须全球唯一）
gcloud projects create classarranger-app-$(date +%s) --name="ClassArranger"

# 查看项目列表
gcloud projects list
```

记下你的 **PROJECT_ID**（类似 `classarranger-app-1234567890`）

### 2.3 设置项目和启用计费

```bash
# 设置默认项目
gcloud config set project YOUR_PROJECT_ID

# 列出计费账号
gcloud billing accounts list

# 关联计费账号
gcloud billing projects link YOUR_PROJECT_ID \
  --billing-account=YOUR_BILLING_ACCOUNT_ID
```

### 2.4 启用必要的API

```bash
# 启用Compute Engine API
gcloud services enable compute.googleapis.com
```

✅ **GCP环境准备完成！**

---

## 第三步：配置Terraform

### 3.1 克隆项目代码

```bash
# 克隆仓库
git clone https://github.com/seisei-sekai/ClassArranger.git
cd ClassArranger

# 或者如果你已经有代码
cd /path/to/your/ClassArranger
```

### 3.2 配置Terraform变量

```bash
# 进入Terraform目录
cd terraform/vm

# 复制配置文件
cp terraform.tfvars.example terraform.tfvars

# 编辑配置文件
nano terraform.tfvars  # 或使用你喜欢的编辑器
```

**编辑 `terraform.tfvars`:**
```hcl
# GCP Project Configuration
project_id = "classarranger-app-1234567890"  # 替换为你的项目ID
region     = "asia-northeast1"  # 东京区域（Tokyo）
zone       = "asia-northeast1-a"  # 东京可用区A（低延迟）

# VM Instance Configuration
instance_name  = "classarranger-vm"
machine_type   = "e2-medium"  # 推荐配置
boot_disk_size = 20

# Network Configuration
use_static_ip = false  # 改为true可获得固定IP

# Deployment Configuration
wait_for_deployment = true
```

**机器类型选择（东京区域价格）:**
| 类型 | vCPU | 内存 | 月费用 | 适用场景 |
|------|------|------|--------|---------|
| e2-micro | 0.25-2 | 1GB | ~$7 | 测试 |
| e2-small | 0.5-2 | 2GB | ~$14 | 轻量使用 |
| **e2-medium** | **2** | **4GB** | **~$27** | **推荐** |
| e2-standard-2 | 2 | 8GB | ~$53 | 高负载 |

### 3.3 初始化Terraform

```bash
# 初始化Terraform（下载provider插件）
terraform init
```

输出应该显示：
```
Terraform has been successfully initialized!
```

✅ **Terraform配置完成！**

---

## 第四步：部署应用

### 方法一：使用自动化脚本（推荐）

```bash
# 回到项目根目录
cd ../..

# 设置环境变量
export PROJECT_ID="classarranger-app-1234567890"
export REGION="asia-northeast1"  # 东京区域
export ZONE="asia-northeast1-a"  # 东京可用区A
export MACHINE_TYPE="e2-medium"

# 运行部署脚本
./scripts/terraform-deploy.sh
```

脚本会自动：
1. ✅ 验证Terraform配置
2. ✅ 生成执行计划
3. ✅ 创建GCP资源
4. ✅ 部署应用代码
5. ✅ 运行健康检查
6. ✅ 显示访问地址

⏰ **等待时间:** 约10-15分钟

### 方法二：手动Terraform命令

```bash
# 1. 进入Terraform目录
cd terraform/vm

# 2. 验证配置
terraform validate

# 3. 格式化代码
terraform fmt

# 4. 生成执行计划
terraform plan \
  -var="project_id=YOUR_PROJECT_ID" \
  -var="region=asia-northeast1" \
  -var="zone=asia-northeast1-a" \
  -var="machine_type=e2-medium" \
  -out=tfplan

# 5. 查看执行计划（确认要创建的资源）
# Terraform会显示将要创建的资源列表

# 6. 应用更改
terraform apply tfplan

# 7. 查看输出
terraform output
```

**重要概念：**

**`terraform plan`** - 预览更改
- 显示将要创建/修改/删除的资源
- 不会实际执行任何操作
- 类似于"预览"功能

**`terraform apply`** - 应用更改
- 执行plan中的更改
- 创建/修改/删除资源
- 需要确认（输入"yes"）

**`terraform destroy`** - 销毁资源
- 删除所有Terraform管理的资源
- 谨慎使用！

### 4.1 部署过程示例

```
╔═══════════════════════════════════════════════════╗
║       ClassArranger Terraform 自动部署            ║
╚═══════════════════════════════════════════════════╝

[1/5] Terraform Init - 初始化...
✅ 初始化完成

[2/5] Terraform Format - 格式化代码...
✅ 格式化完成

[3/5] Terraform Validate - 验证配置...
✅ 验证通过

[4/5] Terraform Plan - 生成执行计划...

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

Plan: 3 to add, 0 to change, 0 to destroy.

✅ 执行计划已生成

[5/5] Terraform Apply - 应用更改...
✅ 基础设施创建完成

╔═══════════════════════════════════════════════════╗
║         🎉 基础设施部署成功！                      ║
╚═══════════════════════════════════════════════════╝

📱 访问信息
==================================
外部IP: 34.123.45.67
前端应用: http://34.123.45.67
后端API: http://34.123.45.67:8000
```

### 4.2 获取部署信息

```bash
# 查看所有输出
cd terraform/vm
terraform output

# 查看特定输出
terraform output external_ip
terraform output frontend_url
terraform output backend_url
terraform output ssh_command
```

✅ **部署成功！**

---

## 第五步：CI/CD自动化

### 5.1 GitHub Actions设置

项目已包含GitHub Actions配置文件：`.github/workflows/terraform-deploy.yml`

**功能：**
- ✅ Pull Request时自动运行 `terraform plan`
- ✅ 合并到main分支时自动部署
- ✅ 手动触发部署/销毁
- ✅ 自动运行健康检查
- ✅ 评论部署信息

### 5.2 配置GitHub Secrets

1. 访问你的GitHub仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 添加以下Secrets：

| Secret名称 | 值 | 说明 |
|-----------|-------|------|
| `GCP_PROJECT_ID` | `classarranger-app-xxx` | GCP项目ID |
| `GCP_REGION` | `asia-northeast1` | GCP区域（东京） |
| `GCP_ZONE` | `asia-northeast1-a` | GCP可用区（东京A） |
| `VM_MACHINE_TYPE` | `e2-medium` | VM机器类型 |
| `USE_STATIC_IP` | `false` | 是否使用静态IP |
| `GCP_SA_KEY` | `{...}` | GCP服务账号密钥（JSON） |

### 5.3 创建GCP服务账号

```bash
# 1. 创建服务账号
gcloud iam service-accounts create terraform-deployer \
  --display-name="Terraform Deployer"

# 2. 授予权限
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:terraform-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/compute.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:terraform-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# 3. 创建密钥
gcloud iam service-accounts keys create terraform-key.json \
  --iam-account=terraform-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com

# 4. 复制JSON内容
cat terraform-key.json
# 将输出的JSON复制到GitHub Secrets的GCP_SA_KEY中
```

⚠️ **重要:** 完成后删除本地密钥文件
```bash
rm terraform-key.json
```

### 5.4 触发自动部署

**方法一：Push到main分支**
```bash
git add .
git commit -m "Deploy application"
git push origin main

# GitHub Actions会自动：
# 1. 运行terraform plan
# 2. 应用terraform apply
# 3. 部署应用代码
# 4. 运行健康检查
# 5. 评论部署信息
```

**方法二：Pull Request**
```bash
git checkout -b feature/update
git add .
git commit -m "Update feature"
git push origin feature/update

# 创建Pull Request后，GitHub Actions会：
# 1. 运行terraform plan
# 2. 在PR中评论计划详情
# 3. 不会实际部署
```

**方法三：手动触发**
1. 访问GitHub仓库的 **Actions** 标签页
2. 选择 **Terraform Deploy** workflow
3. 点击 **Run workflow**
4. 选择操作：
   - `plan` - 仅查看计划
   - `apply` - 部署应用
   - `destroy` - 销毁资源

### 5.5 监控部署

在GitHub Actions页面可以看到：
- ✅ 每一步的执行日志
- ✅ Terraform输出
- ✅ 部署的URL
- ✅ 健康检查结果

---

## 常见问题

### Q1: Terraform init失败？

**错误:** `Error: Failed to get existing workspaces`

**解决方案:**
```bash
# 删除.terraform目录重新初始化
cd terraform/vm
rm -rf .terraform
terraform init
```

### Q2: 权限错误？

**错误:** `Error: Error creating instance: googleapi: Error 403`

**解决方案:**
```bash
# 确认已启用计费
gcloud billing projects describe YOUR_PROJECT_ID

# 确认已启用Compute Engine API
gcloud services enable compute.googleapis.com

# 确认认证
gcloud auth application-default login
```

### Q3: 如何查看Terraform状态？

```bash
cd terraform/vm

# 查看当前状态
terraform show

# 查看资源列表
terraform state list

# 查看特定资源
terraform state show google_compute_instance.app
```

### Q4: 如何更新应用代码？

**方法一：重新运行部署脚本**
```bash
export PROJECT_ID="your-project-id"
./scripts/terraform-deploy.sh
```

**方法二：手动更新**
```bash
# SSH到VM
gcloud compute ssh classarranger-vm --zone=asia-northeast1-a

# 更新代码
cd /opt/classarranger
git pull  # 如果使用git

# 重启服务
docker-compose -f docker-compose.prod.yml restart
```

**方法三：使用CI/CD**
```bash
git push origin main
# GitHub Actions会自动部署
```

### Q5: 如何修改VM配置？

```bash
# 1. 编辑terraform.tfvars
cd terraform/vm
nano terraform.tfvars

# 例如：改为更小的机器类型
# machine_type = "e2-small"

# 2. 查看会改变什么
terraform plan

# 3. 应用更改
terraform apply

# 4. VM会被停止并重新创建
```

### Q6: 如何备份Terraform状态？

```bash
# Terraform状态文件很重要！

cd terraform/vm

# 备份状态文件
cp terraform.tfstate terraform.tfstate.backup

# 或者使用远程backend（推荐生产环境）
# 在main.tf中添加：
terraform {
  backend "gcs" {
    bucket = "your-terraform-state-bucket"
    prefix = "classarranger"
  }
}
```

### Q7: 如何销毁所有资源？

```bash
cd terraform/vm

# 预览将要删除的资源
terraform plan -destroy

# 销毁所有资源
terraform destroy

# 或使用GitHub Actions手动触发destroy
```

⚠️ **警告:** 销毁后所有数据将丢失！请先备份MongoDB数据。

### Q8: 部署失败如何回滚？

```bash
# Terraform没有内置回滚，但可以这样做：

# 方法一：使用Git回滚代码
git revert HEAD
terraform apply

# 方法二：恢复旧的terraform.tfstate
cp terraform.tfstate.backup terraform.tfstate
terraform apply

# 方法三：销毁并重新部署
terraform destroy
terraform apply
```

### Q9: 如何查看部署成本？

```bash
# 使用terraform-cost-estimation（可选）
terraform plan -out=tfplan
terraform show -json tfplan | infracost breakdown --path=-

# 或访问GCP Console
# Billing → Cost table
```

### Q10: 如何添加监控？

```bash
# 在terraform/vm/main.tf中添加：

# Cloud Monitoring
resource "google_monitoring_uptime_check_config" "http" {
  display_name = "classarranger-uptime"
  timeout      = "10s"
  
  http_check {
    path         = "/health"
    port         = "8000"
    request_method = "GET"
  }
  
  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = google_compute_instance.app.network_interface[0].access_config[0].nat_ip
    }
  }
}
```

---

## 🎯 Terraform工作流程

```
┌─────────────────────────────────────────────┐
│              开发流程                        │
└─────────────────────────────────────────────┘

1. 编写/修改 Terraform配置
   ├── main.tf (资源定义)
   ├── variables.tf (变量)
   ├── outputs.tf (输出)
   └── terraform.tfvars (配置值)
   
2. terraform init
   └── 下载provider插件
   
3. terraform plan
   └── 预览将要创建的资源
   
4. terraform apply
   └── 创建/更新资源
   
5. terraform output
   └── 查看输出值（IP、URL等）
   
6. (可选) terraform destroy
   └── 删除所有资源
```

---

## 📚 Terraform命令速查

```bash
# 基础命令
terraform init      # 初始化
terraform validate  # 验证配置
terraform fmt       # 格式化代码
terraform plan      # 生成执行计划
terraform apply     # 应用更改
terraform destroy   # 销毁资源

# 状态管理
terraform show      # 显示当前状态
terraform state list  # 列出所有资源
terraform state show RESOURCE  # 显示特定资源
terraform output    # 显示输出值
terraform output -json  # JSON格式输出

# 高级命令
terraform import    # 导入现有资源
terraform taint     # 标记资源需重建
terraform untaint   # 取消标记
terraform refresh   # 刷新状态
terraform graph     # 生成依赖图
```

---

## 🚀 下一步

### 生产环境优化

1. **使用Remote Backend**
```hcl
terraform {
  backend "gcs" {
    bucket = "your-terraform-state"
    prefix = "classarranger"
  }
}
```

2. **添加监控告警**
- Cloud Monitoring
- Uptime checks
- 告警策略

3. **配置HTTPS**
- 使用Let's Encrypt
- 配置域名

4. **自动备份**
- MongoDB自动备份
- Terraform状态备份

5. **多环境部署**
```bash
# 开发环境
terraform workspace new dev
terraform apply -var-file=dev.tfvars

# 生产环境
terraform workspace new prod
terraform apply -var-file=prod.tfvars
```

---

## 💡 小贴士

1. **Terraform状态文件很重要** - 定期备份
2. **使用version control** - 将.tf文件提交到Git
3. **不要提交敏感信息** - 使用.gitignore排除terraform.tfvars
4. **使用terraform fmt** - 保持代码格式一致
5. **先plan再apply** - 预览更改避免意外
6. **使用变量** - 提高配置可重用性
7. **添加注释** - 解释复杂配置
8. **模块化** - 将配置拆分为可重用模块

---

## 📖 相关文档

- [Terraform官方文档](https://www.terraform.io/docs)
- [GCP Provider文档](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [本地MongoDB指南](./local-mongodb-guide.md)
- [Mock模式指南](./mock-mode-guide.md)
- [部署方案对比](./deployment-comparison.md)

---

**祝你部署成功！🚀**

**总结：**
- ✅ Infrastructure as Code - 代码即基础设施
- ✅ 一键部署 - 10分钟完成
- ✅ CI/CD自动化 - Push即部署
- ✅ 版本控制 - 可回滚
- ✅ 预览更改 - terraform plan
- ✅ 成本可控 - 约$27/月（东京区域）
- ✅ 低延迟 - 东京服务器，亚洲访问更快
