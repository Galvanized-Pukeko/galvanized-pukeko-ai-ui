gcloud run deploy test-agent-service \
--source . \
--region global \
--project $TEST_AGENT_GCP_PROJECT \
--allow-unauthenticated \
--set-env-vars="GOOGLE_CLOUD_PROJECT=$TEST_AGENT_GCP_PROJECT,GOOGLE_CLOUD_LOCATION=global,GOOGLE_GENAI_USE_VERTEXAI=true,WEB_HOST=$TEST_AGENT_HOST"
