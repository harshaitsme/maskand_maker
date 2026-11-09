export type MediaAssetType = "image" | "model-3d" | "document";

export interface ModelMetadata {
  triangleCount?: number;
  format: "glb" | "gltf";
  hasTextures: boolean;
  dracoCompressed: boolean;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface MediaAssetDoc {
  id: string;
  key: string;
  bucket: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  assetType: MediaAssetType;
  maskSlug?: string;
  artisanSlug?: string;
  publicUrl: string;
  dimensions?: ImageDimensions;
  modelMetadata?: ModelMetadata;
  uploadedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MediaStats {
  totalAssets: number;
  imagesCount: number;
  models3DCount: number;
  totalBytesStored: number;
}
