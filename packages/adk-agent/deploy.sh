gcloud run deploy test-agent-service \
--source . \
--region us-west1 \
--project $TEST_AGENT_GCP_PROJECT \
--allow-unauthenticated \
--set-env-vars="GOOGLE_CLOUD_PROJECT=$TEST_AGENT_GCP_PROJECT,GOOGLE_CLOUD_LOCATION=us-west1,GOOGLE_GENAI_USE_VERTEXAI=1"
