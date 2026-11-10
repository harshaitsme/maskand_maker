FROM python:3.10-slim

WORKDIR /app

# 1. Install system build tools (cmake is required to compile torchmcubes)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git build-essential cmake curl libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 2. Install PyTorch CPU
RUN pip install --no-cache-dir --index-url https://pypi.org/simple typing-extensions
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 3. Install build dependencies and compile torchmcubes
RUN pip install --no-cache-dir scikit-build-core pybind11
RUN pip install --no-cache-dir --no-build-isolation git+https://github.com/tatsy/torchmcubes.git

# 4. Clone TripoSR repo directly (it provides the 'tsr' module)
RUN git clone https://github.com/VAST-AI-Research/TripoSR.git /app/TripoSR

# 5. Install TripoSR dependencies and web server libraries
RUN pip install --no-cache-dir \
    omegaconf einops "transformers==4.35.0" "huggingface-hub<0.26.0" trimesh rembg \
    fastapi uvicorn requests pillow pydantic python-multipart onnxruntime

# 6. Add TripoSR to Python path & optimize CPU thread execution
ENV PYTHONPATH=/app/TripoSR
ENV OMP_NUM_THREADS=4
ENV MKL_NUM_THREADS=4

# 7. Pre-download model weights into container image (with resilient fallback for CI environments)
COPY preload.py ./
RUN python preload.py || true

# 8. Copy application code
COPY app.py ./

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
