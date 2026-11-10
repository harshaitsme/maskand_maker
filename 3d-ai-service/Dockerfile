# --- Stage 1: Builder ---
FROM python:3.10-slim AS builder

WORKDIR /app

# Install system build tools required for torchmcubes and other packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    git build-essential cmake libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU and build dependencies
RUN pip install --no-cache-dir --index-url https://pypi.org/simple typing-extensions
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir scikit-build-core pybind11

# Compile and install torchmcubes
RUN pip install --no-cache-dir --no-build-isolation git+https://github.com/tatsy/torchmcubes.git

# Clone TripoSR repo
RUN git clone https://github.com/VAST-AI-Research/TripoSR.git /app/TripoSR

# Install TripoSR dependencies and web server libraries
RUN pip install --no-cache-dir \
    omegaconf einops "transformers==4.35.0" "huggingface-hub<0.26.0" trimesh rembg \
    fastapi uvicorn requests pillow pydantic python-multipart onnxruntime

# --- Stage 2: Final Runtime ---
FROM python:3.10-slim

WORKDIR /app

# Install runtime system dependencies (including curl for the healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages and application from builder
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app/TripoSR /app/TripoSR

# Set environment variables
ENV PYTHONPATH=/app/TripoSR
ENV OMP_NUM_THREADS=4
ENV MKL_NUM_THREADS=4
ENV PYTHONUNBUFFERED=1

# Pre-download model weights
RUN python -c "\
from tsr.system import TSR; \
import rembg; \
print('Pre-downloading rembg u2net model...'); \
rembg.new_session(); \
print('Pre-downloading TripoSR weights from HuggingFace...'); \
TSR.from_pretrained('stabilityai/TripoSR', config_name='config.yaml', weight_name='model.ckpt'); \
print('Model weights baked into image successfully!'); \
"

# Create a non-root user and switch to it
RUN useradd -m appuser
USER appuser

# Copy application code
COPY app.py ./

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
