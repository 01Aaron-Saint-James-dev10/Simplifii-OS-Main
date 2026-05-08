#!/bin/bash

# Simplifii-OS Production Google Cloud Setup Script
# Run this inside Google Cloud Shell or any terminal authenticated with gcloud

echo "Starting Simplifii-OS Google Cloud API Enablement..."

# 1. Enable Vertex AI / Grounding
echo "Enabling Vertex AI API..."
gcloud services enable aiplatform.googleapis.com

# 2. Enable Document AI (Layout Parser)
echo "Enabling Document AI API..."
gcloud services enable documentai.googleapis.com

# 3. Enable Google Drive API (Research Knowledge)
echo "Enabling Google Drive API..."
gcloud services enable drive.googleapis.com

# 4. Enable Google People API (Identity/Persona)
echo "Enabling Google People API..."
gcloud services enable people.googleapis.com

# 5. Enable Google Sheets API (Cognitive Ledger)
echo "Enabling Google Sheets API..."
gcloud services enable sheets.googleapis.com

# 6. Enable Cloud Translation API (Multi-Modal)
echo "Enabling Cloud Translation API..."
gcloud services enable translate.googleapis.com

# 7. Enable Enterprise Knowledge Graph API (Semantic Mapping)
echo "Enabling Enterprise Knowledge Graph API..."
gcloud services enable enterpriseknowledgegraph.googleapis.com

echo "Verification:"
gcloud services list --enabled --filter="name:aiplatform OR name:documentai OR name:drive OR name:people OR name:sheets OR name:translate OR name:enterpriseknowledgegraph"

echo "Setup Complete! Your Simplifii-OS GCP backend is now wired for production."
