#!/bin/bash

# ClassArranger Git Rollback Script
# Rollback to a specific commit on the VM

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-"project-2a5e0dcf-0fe6-42d1-9be"}
ZONE=${ZONE:-"asia-northeast1-a"}
INSTANCE_NAME=${INSTANCE_NAME:-"classarranger-vm"}

# Function to print step
print_step() {
    echo -e "${YELLOW}>>> $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   ClassArranger Git Rollback${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if commit hash is provided
if [ -z "$1" ]; then
    print_error "Usage: $0 <commit-hash>"
    echo ""
    echo "Examples:"
    echo "  $0 abc1234              # Rollback to specific commit"
    echo "  $0 HEAD~1               # Rollback to previous commit"
    echo "  $0 HEAD~2               # Rollback 2 commits back"
    echo ""
    echo "To view commit history:"
    echo "  git log --oneline -n 10"
    echo ""
    exit 1
fi

COMMIT_HASH=$1

# Show current commit on VM
print_step "Current commit on VM:"
gcloud compute ssh "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --command="cd /opt/classarranger && git log -1 --oneline"

echo ""
read -p "Are you sure you want to rollback to $COMMIT_HASH? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Rollback cancelled"
    exit 1
fi

# Perform rollback
print_step "Rolling back to $COMMIT_HASH..."
gcloud compute ssh "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --command="cd /opt/classarranger && git fetch origin && git checkout $COMMIT_HASH"

if [ $? -eq 0 ]; then
    print_success "Checked out $COMMIT_HASH"
else
    print_error "Failed to checkout $COMMIT_HASH"
    exit 1
fi

# Rebuild and restart services
print_step "Rebuilding services..."
gcloud compute ssh "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --command="cd /opt/classarranger && sudo docker-compose -f docker-compose.prod.yml up -d --build"

if [ $? -eq 0 ]; then
    print_success "Services restarted"
else
    print_error "Failed to restart services"
    exit 1
fi

# Wait and health check
print_step "Waiting for services (30 seconds)..."
sleep 30

EXTERNAL_IP=$(gcloud compute instances describe "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --format="value(networkInterfaces[0].accessConfigs[0].natIP)")

echo -n "Testing backend... "
if curl -s -f "http://$EXTERNAL_IP:8000/health" > /dev/null 2>&1; then
    print_success "Healthy"
else
    print_error "Failed"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}   Rollback Complete! 🔄${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC}  http://$EXTERNAL_IP"
echo -e "${BLUE}Backend:${NC}   http://$EXTERNAL_IP:8000"
echo ""
print_step "Current commit on VM:"
gcloud compute ssh "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --command="cd /opt/classarranger && git log -1 --oneline"
echo ""

