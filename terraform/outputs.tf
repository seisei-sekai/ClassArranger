output "backend_url" {
  description = "Backend Service URL"
  value       = google_cloud_run_service.backend.status[0].url
}

output "frontend_url" {
  description = "Frontend Service URL"
  value       = google_cloud_run_service.frontend.status[0].url
}

output "backend_service_name" {
  description = "Backend Service Name"
  value       = google_cloud_run_service.backend.name
}

output "frontend_service_name" {
  description = "Frontend Service Name"
  value       = google_cloud_run_service.frontend.name
}

