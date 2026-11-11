import sys

print("Checking and pre-downloading model weights if network is accessible...")

try:
    import rembg
    print("Pre-downloading rembg u2net model...")
    rembg.new_session()
    print("rembg u2net downloaded successfully.")
except Exception as e:
    print(f"rembg pre-download skipped: {e}")

try:
    from tsr.system import TSR
    print("Pre-downloading TripoSR weights from HuggingFace...")
    TSR.from_pretrained("stabilityai/TripoSR", config_name="config.yaml", weight_name="model.ckpt")
    print("TripoSR model weights baked into image successfully!")
except Exception as e:
    print(f"TripoSR pre-download skipped (will load on startup): {e}")

print("Pre-loading step completed.")
