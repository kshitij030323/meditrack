import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Native / heavy server-only packages are loaded from node_modules at runtime
  // instead of being bundled (ONNX runtime for local embeddings, pg driver).
  serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node', 'pg'],
  devIndicators: false,
};

export default nextConfig;
