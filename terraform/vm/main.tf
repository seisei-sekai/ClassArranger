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

# Enable required APIs
resource "google_project_service" "compute" {
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

# Firewall rule for HTTP (port 80)
resource "google_compute_firewall" "http" {
  name    = "classarranger-http"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["classarranger"]

  depends_on = [google_project_service.compute]
}

# Firewall rule for API (port 8000)
resource "google_compute_firewall" "api" {
  name    = "classarranger-api"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["8000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["classarranger"]

  depends_on = [google_project_service.compute]
}

# Static IP address (optional but recommended)
resource "google_compute_address" "static" {
  count  = var.use_static_ip ? 1 : 0
  name   = "classarranger-ip"
  region = var.region

  depends_on = [google_project_service.compute]
}

# Startup script template
data "template_file" "startup_script" {
  template = file("${path.module}/startup-script.sh")

  vars = {
    project_id = var.project_id
    region     = var.region
  }
}

# Metadata script for deploying application
data "template_file" "deploy_script" {
  template = file("${path.module}/deploy-app.sh")

  vars = {
    backend_url = var.use_static_ip && length(google_compute_address.static) > 0 ? "http://${google_compute_address.static[0].address}:8000" : "http://$${EXTERNAL_IP}:8000"
  }
}

# Compute Engine VM instance
resource "google_compute_instance" "app" {
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zone

  tags = ["classarranger"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = var.boot_disk_size
      type  = "pd-standard"
    }
  }

  network_interface {
    network = "default"

    access_config {
      nat_ip = var.use_static_ip && length(google_compute_address.static) > 0 ? google_compute_address.static[0].address : null
    }
  }

  metadata_startup_script = <<-EOT
    #!/bin/bash
    set -e
    
    # Log everything
    exec > >(tee /var/log/startup-script.log)
    exec 2>&1
    
    echo "Starting ClassArranger setup..."
    
    # Install Git
    if ! command -v git &> /dev/null; then
      echo "Installing Git..."
      apt-get update
      apt-get install -y git
    fi
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
      echo "Installing Docker..."
      curl -fsSL https://get.docker.com -o get-docker.sh
      sh get-docker.sh
      systemctl start docker
      systemctl enable docker
      rm get-docker.sh
    fi
    
    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
      echo "Installing Docker Compose..."
      curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
      chmod +x /usr/local/bin/docker-compose
    fi
    
    # Create application directory
    mkdir -p /opt/classarranger
    cd /opt/classarranger
    
    # Clone or update repository
    if [ ! -d ".git" ]; then
      if [ -n "${var.git_repo_url}" ]; then
        echo "Cloning repository..."
        git clone ${var.git_repo_url} .
      else
        echo "No git repository specified, waiting for manual deployment..."
        touch /opt/classarranger/.awaiting-deployment
      fi
    else
      echo "Repository already exists, pulling latest..."
      git pull
    fi
    
    # Get external IP
    EXTERNAL_IP=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H 'Metadata-Flavor: Google')
    
    # Set environment variables for deployment
    export VITE_API_URL=http://$EXTERNAL_IP:8000
    
    # Deploy application if code exists
    if [ -f "docker-compose.prod.yml" ]; then
      echo "Deploying application..."
      
      # Stop existing containers
      docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
      
      # Start services
      docker-compose -f docker-compose.prod.yml up -d --build
      
      echo "Application deployed successfully!"
      echo "Frontend: http://$EXTERNAL_IP"
      echo "Backend: http://$EXTERNAL_IP:8000"
    else
      echo "docker-compose.prod.yml not found, skipping deployment"
    fi
    
    echo "Setup complete!"
  EOT

  service_account {
    scopes = ["cloud-platform"]
  }

  allow_stopping_for_update = true

  depends_on = [
    google_project_service.compute,
    google_compute_firewall.http,
    google_compute_firewall.api
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# Health check (optional)
resource "null_resource" "health_check" {
  count = var.wait_for_deployment ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      echo "Waiting for deployment to complete (60 seconds)..."
      sleep 60
      
      EXTERNAL_IP=${google_compute_instance.app.network_interface[0].access_config[0].nat_ip}
      
      echo "Testing backend health..."
      curl -f http://$EXTERNAL_IP:8000/health || echo "Backend health check failed"
      
      echo "Testing frontend..."
      curl -f http://$EXTERNAL_IP || echo "Frontend health check failed"
      
      echo "Deployment complete!"
    EOT
  }

  depends_on = [google_compute_instance.app]
}

