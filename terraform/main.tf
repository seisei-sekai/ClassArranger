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

# Backend Cloud Run Service
resource "google_cloud_run_service" "backend" {
  name     = "classarranger-backend"
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/classarranger-images/backend:latest"
        
        ports {
          container_port = 8000
        }

        env {
          name  = "FIREBASE_PROJECT_ID"
          value = var.project_id
        }

        env {
          name  = "OPENAI_API_KEY"
          value = var.openai_api_key
        }

        env {
          name  = "GOOGLE_APPLICATION_CREDENTIALS"
          value = "/app/service-account.json"
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "autoscaling.knative.dev/minScale" = "0"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Frontend Cloud Run Service
resource "google_cloud_run_service" "frontend" {
  name     = "classarranger-frontend"
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/classarranger-images/frontend:latest"
        
        ports {
          container_port = 5173
        }

        env {
          name  = "VITE_API_URL"
          value = google_cloud_run_service.backend.status[0].url
        }

        env {
          name  = "VITE_FIREBASE_API_KEY"
          value = var.firebase_api_key
        }

        env {
          name  = "VITE_FIREBASE_AUTH_DOMAIN"
          value = var.firebase_auth_domain
        }

        env {
          name  = "VITE_FIREBASE_PROJECT_ID"
          value = var.project_id
        }

        env {
          name  = "VITE_FIREBASE_STORAGE_BUCKET"
          value = var.firebase_storage_bucket
        }

        env {
          name  = "VITE_FIREBASE_MESSAGING_SENDER_ID"
          value = var.firebase_messaging_sender_id
        }

        env {
          name  = "VITE_FIREBASE_APP_ID"
          value = var.firebase_app_id
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "autoscaling.knative.dev/minScale" = "0"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Allow public access to backend
resource "google_cloud_run_service_iam_member" "backend_public" {
  service  = google_cloud_run_service.backend.name
  location = google_cloud_run_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Allow public access to frontend
resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_service.frontend.name
  location = google_cloud_run_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

