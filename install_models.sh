#!/bin/bash
echo "Installing required models..."
# Check tier
if [ "$MODEL_TIER" = "lite" ]; then
    echo "Lite Mode: Installing only highly quantized fallback and executor"
    docker exec -it dataclaw-model_router-1 ollama pull tinydolphin:latest
    docker exec -it dataclaw-model_router-1 ollama pull mistral:7b-instruct
else
    docker exec -it dataclaw-model_router-1 ollama pull mistral:7b-instruct
    docker exec -it dataclaw-model_router-1 ollama pull deepseek-r1:latest
    docker exec -it dataclaw-model_router-1 ollama pull codellama:7b
    docker exec -it dataclaw-model_router-1 ollama pull llama3:8b
    docker exec -it dataclaw-model_router-1 ollama pull tinydolphin:latest
fi
echo "Models installed successfully."
