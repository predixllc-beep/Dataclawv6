FROM python:3.11-slim
WORKDIR /opt/dataclaw
COPY requirements.txt .
RUN pip install -r requirements.txt || true
COPY . .
# Basic dummy CMD so it builds
CMD ["python", "-m", "dataclaw_core.main"]
