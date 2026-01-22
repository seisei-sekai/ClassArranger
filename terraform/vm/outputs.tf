output "instance_name" {
  description = "Name of the VM instance"
  value       = google_compute_instance.app.name
}

output "instance_id" {
  description = "ID of the VM instance"
  value       = google_compute_instance.app.instance_id
}

output "external_ip" {
  description = "External IP address of the VM instance"
  value       = google_compute_instance.app.network_interface[0].access_config[0].nat_ip
}

output "static_ip" {
  description = "Static IP address (if enabled)"
  value       = var.use_static_ip && length(google_compute_address.static) > 0 ? google_compute_address.static[0].address : "Not using static IP"
}

output "frontend_url" {
  description = "URL to access the frontend application"
  value       = "http://${google_compute_instance.app.network_interface[0].access_config[0].nat_ip}"
}

output "backend_url" {
  description = "URL to access the backend API"
  value       = "http://${google_compute_instance.app.network_interface[0].access_config[0].nat_ip}:8000"
}

output "api_docs_url" {
  description = "URL to access the API documentation"
  value       = "http://${google_compute_instance.app.network_interface[0].access_config[0].nat_ip}:8000/docs"
}

output "ssh_command" {
  description = "Command to SSH into the VM"
  value       = "gcloud compute ssh ${google_compute_instance.app.name} --zone=${var.zone} --project=${var.project_id}"
}

output "deployment_info" {
  description = "Deployment information"
  value = {
    project_id    = var.project_id
    region        = var.region
    zone          = var.zone
    instance_name = google_compute_instance.app.name
    machine_type  = var.machine_type
    external_ip   = google_compute_instance.app.network_interface[0].access_config[0].nat_ip
  }
}

