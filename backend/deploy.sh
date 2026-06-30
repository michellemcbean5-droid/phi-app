#!/usr/bin/env bash
# deploy.sh — Prince Haul Intelligence backend deployment script
#
# Supports two targets:
#   ./deploy.sh render      Deploy to Render (recommended — zero-infra, free Postgres)
#   ./deploy.sh aws         Deploy to AWS ECS Fargate (production-scale)
#
# Prerequisites:
#   Render:  Render account + render CLI (npm i -g @render-com/cli) + render.yaml
#   AWS:     AWS CLI + Docker + an ECR repo + an ECS cluster already configured
#
# All sensitive values (API keys, DB password) must be set in your cloud
# platform's secret/environment variable store — NOT in this script.

set -euo pipefail

TARGET="${1:-render}"
IMAGE_NAME="phi-backend"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
ECR_REPO="${ECR_REPO:-phi-backend}"
ECS_CLUSTER="${ECS_CLUSTER:-phi-cluster}"
ECS_SERVICE="${ECS_SERVICE:-phi-api}"

# ─── Helper ───────────────────────────────────────────────────────────────────
log() { echo "[deploy] $*"; }

# ─── Render deployment ────────────────────────────────────────────────────────
deploy_render() {
  log "Deploying to Render..."

  # Render can deploy directly from Git — push to your linked branch.
  # This script handles the git push and optionally triggers a manual deploy.

  if ! command -v render &>/dev/null; then
    log "Render CLI not found. Deploying via git push instead."
    git push origin HEAD
    log "Done. Render will auto-deploy from your connected branch."
    log "Monitor at: https://dashboard.render.com"
    return
  fi

  # If render CLI is installed, trigger a deploy for the service named phi-api.
  render deploy --service phi-api --wait
  log "Render deployment complete."
  log "API URL: check your Render dashboard for the live URL."
}

# ─── AWS ECS Fargate deployment ───────────────────────────────────────────────
deploy_aws() {
  log "Deploying to AWS ECS Fargate (region: ${AWS_REGION})..."

  if [[ -z "$AWS_ACCOUNT_ID" ]]; then
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  fi

  ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

  # 1. Authenticate Docker to ECR
  log "Logging in to ECR..."
  aws ecr get-login-password --region "${AWS_REGION}" \
    | docker login --username AWS --password-stdin "${ECR_URI}"

  # 2. Build the image
  log "Building Docker image..."
  docker build --platform linux/amd64 -t "${IMAGE_NAME}:latest" .

  # 3. Tag and push to ECR
  log "Pushing to ECR: ${ECR_URI}"
  docker tag "${IMAGE_NAME}:latest" "${ECR_URI}:latest"
  docker push "${ECR_URI}:latest"

  # 4. Force a new ECS deployment (picks up the new image)
  log "Triggering ECS service update..."
  aws ecs update-service \
    --cluster "${ECS_CLUSTER}" \
    --service "${ECS_SERVICE}" \
    --force-new-deployment \
    --region "${AWS_REGION}" \
    --output text --query "service.serviceName"

  log "Waiting for ECS deployment to stabilize..."
  aws ecs wait services-stable \
    --cluster "${ECS_CLUSTER}" \
    --services "${ECS_SERVICE}" \
    --region "${AWS_REGION}"

  log "AWS ECS deployment complete."
  log "Check health: aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE}"
}

# ─── Local Docker Compose (quick smoke-test before deploying) ─────────────────
deploy_local() {
  log "Starting local production stack with docker compose..."
  docker compose up --build -d
  log "Waiting for health check..."
  sleep 8
  curl -sf http://localhost:8000/health | python3 -m json.tool || true
  log "Stack running. Logs: docker compose logs -f api"
}

# ─── Dispatch ─────────────────────────────────────────────────────────────────
case "$TARGET" in
  render) deploy_render ;;
  aws)    deploy_aws    ;;
  local)  deploy_local  ;;
  *)
    echo "Usage: $0 [render|aws|local]"
    echo "  render  — Deploy to Render via git push or Render CLI"
    echo "  aws     — Build, push to ECR, and update ECS Fargate service"
    echo "  local   — docker compose up (smoke-test locally)"
    exit 1
    ;;
esac
