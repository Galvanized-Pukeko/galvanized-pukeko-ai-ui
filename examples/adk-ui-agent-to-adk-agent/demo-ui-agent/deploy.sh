#!/bin/bash
# Deploy to Google Cloud Run
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - TEST_AGENT_GCP_PROJECT environment variable set
#
# Usage: ./deploy.sh

gcloud run deploy demo-ui-agent \
--source . \
--region us-east5 \
--project $TEST_AGENT_GCP_PROJECT \
--allow-unauthenticated \
--set-env-vars="GOOGLE_CLOUD_PROJECT=$TEST_AGENT_GCP_PROJECT,GOOGLE_CLOUD_LOCATION=us-east5,GOOGLE_GENAI_USE_VERTEXAI=true"
