variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-northeast1" # 东京区域
}

variable "zone" {
  description = "GCP Zone"
  type        = string
  default     = "asia-northeast1-a" # 东京可用区A
}

variable "instance_name" {
  description = "Name of the VM instance"
  type        = string
  default     = "classarranger-vm"
}

variable "machine_type" {
  description = "Machine type for the VM instance"
  type        = string
  default     = "e2-medium"

  validation {
    condition     = contains(["e2-micro", "e2-small", "e2-medium", "e2-standard-2"], var.machine_type)
    error_message = "Machine type must be one of: e2-micro, e2-small, e2-medium, e2-standard-2"
  }
}

variable "boot_disk_size" {
  description = "Size of the boot disk in GB"
  type        = number
  default     = 20

  validation {
    condition     = var.boot_disk_size >= 10 && var.boot_disk_size <= 100
    error_message = "Boot disk size must be between 10 and 100 GB"
  }
}

variable "use_static_ip" {
  description = "Whether to use a static IP address"
  type        = bool
  default     = false
}

variable "git_repo_url" {
  description = "Git repository URL to clone (optional)"
  type        = string
  default     = ""
}

variable "wait_for_deployment" {
  description = "Whether to wait for deployment and run health checks"
  type        = bool
  default     = true
}

