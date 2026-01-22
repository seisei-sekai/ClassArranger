#!/bin/bash
# This script is rendered as a template by Terraform
# Available variables: ${project_id}, ${region}

set -e

echo "ClassArranger Startup Script"
echo "Project: ${project_id}"
echo "Region: ${region}"
echo "Starting at: $(date)"

# This file is kept minimal as the actual startup logic
# is in the metadata_startup_script in main.tf

