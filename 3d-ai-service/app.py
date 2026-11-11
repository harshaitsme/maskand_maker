import io
import logging
import os
import threading
from contextlib import contextmanager

import numpy as np
import rembg
import torch
import trimesh
import trimesh.smoothing
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError

from tsr.system import TSR
from tsr.utils import remove_background, resize_foreground, to_gradio_3d_orientation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_NAME = "stabilityai/TripoSR"
DEVICE = "cuda:0" if torch.cuda.is_available() else "cpu"

# Optimize CPU parallelism
if DEVICE == "cpu":
    cpu_cores = os.cpu_count() or 4
    torch.set_num_threads(cpu_cores)
    logger.info("Configured PyTorch for CPU with %d threads", cpu_cores)

_model = None
_rembg_session = None
_model_lock = threading.Lock()
_inference_lock = threading.Lock()

app = FastAPI(title="Image to GLB", version="1.0.0")


def _get_model() -> TSR:
    global _model

    if _model is None:
        with _model_lock:
            if _model is None:
                logger.info("Loading TripoSR weights on %s...", DEVICE)
                model = TSR.from_pretrained(
                    MODEL_NAME,
                    config_name="config.yaml",
                    weight_name="model.ckpt",
                )
                chunk_size = 131072 if DEVICE == "cpu" else 8192
                model.renderer.set_chunk_size(chunk_size)
                model.to(DEVICE)
                model.eval()
                _model = model
                logger.info("TripoSR loaded successfully on %s (chunk_size=%d)", DEVICE, chunk_size)
    return _model


def _get_rembg_session():
    global _rembg_session

    if _rembg_session is None:
        with _model_lock:
            if _rembg_session is None:
                logger.info("Initializing rembg background removal session...")
                _rembg_session = rembg.new_session()
                logger.info("rembg session ready")
    return _rembg_session


@app.on_event("startup")
def startup_event():
    """Preload models on container boot so API requests execute immediately."""
    logger.info("Pre-warming models on startup...")
    _get_rembg_session()
    _get_model()
    logger.info("All models pre-warmed and ready to serve requests.")


def _prepare_image(image: Image.Image, foreground_ratio: float) -> Image.Image:
    image = remove_background(image.convert("RGB"), _get_rembg_session())
    image = resize_foreground(image, foreground_ratio)
    pixels = np.asarray(image).astype(np.float32) / 255.0
    rgb = pixels[:, :, :3] * pixels[:, :, 3:4] + (1 - pixels[:, :, 3:4]) * 0.5
    return Image.fromarray((rgb * 255.0).astype(np.uint8))


@contextmanager
def _inference():
    with _inference_lock:
        with torch.inference_mode():
            yield


@app.get("/")
def root():
    return {"service": "image-to-glb", "device": DEVICE, "docs": "/docs"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": DEVICE,
        "model_loaded": _model is not None,
        "rembg_loaded": _rembg_session is not None,
    }


@app.post("/convert")
def convert_image(
    image: UploadFile = File(...),
    remove_bg: bool = Query(True, description="Remove background automatically before 3D reconstruction"),
    foreground_ratio: float = Query(0.85, ge=0.5, le=1.0),
    mc_resolution: int = Query(
        256,
        ge=64,
        le=320,
        description="Marching Cubes resolution (256 default for high fidelity, 128 for fast draft)",
    ),
    smooth_mesh: bool = Query(True, description="Apply Laplacian smoothing to eliminate voxel faceting"),
    orientation_fix: bool = Query(True, description="Rotate mesh to upright glTF viewing orientation"),
):
    if image.content_type is not None and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Uploaded file must be an image")

    try:
        input_image = Image.open(io.BytesIO(image.file.read()))
        input_image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image") from exc

    try:
        logger.info(
            "Starting high-fidelity 3D reconstruction (resolution=%d, remove_bg=%s, smooth=%s)...",
            mc_resolution,
            remove_bg,
            smooth_mesh,
        )
        processed_image = (
            _prepare_image(input_image, foreground_ratio)
            if remove_bg
            else input_image.convert("RGB")
        )

        model = _get_model()
        with _inference():
            scene_codes = model([processed_image], device=DEVICE)
            mesh = model.extract_mesh(
                scene_codes,
                has_vertex_color=True,
                resolution=mc_resolution,
            )[0]

        # 1. Correct orientation to standard upright glTF coordinate space
        if orientation_fix:
            mesh = to_gradio_3d_orientation(mesh)

        # 2. Smooth out Marching Cubes voxel stepping for realistic wood carving finish
        if smooth_mesh:
            logger.info("Applying Laplacian smoothing and normal recalculation...")
            trimesh.smoothing.filter_laplacian(mesh, lamb=0.5, iterations=3)

        # 3. Recalculate smooth vertex normals so WebGL renders smooth lighting
        mesh.fix_normals()

        # 4. Center model at origin for smooth rotation
        mesh.vertices -= mesh.bounding_box.centroid

        output = io.BytesIO()
        mesh.export(output, file_type="glb")
        glb_bytes = output.getvalue()

        logger.info("3D reconstruction complete. Exported %d bytes (.glb)", len(glb_bytes))

        return Response(
            content=glb_bytes,
            media_type="model/gltf-binary",
            headers={"Content-Disposition": 'attachment; filename="model.glb"'},
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("GLB conversion failed")
        raise HTTPException(status_code=500, detail="GLB conversion failed") from exc
    finally:
        awaitable_close = getattr(image.file, "close", None)
        if awaitable_close is not None:
            awaitable_close()
