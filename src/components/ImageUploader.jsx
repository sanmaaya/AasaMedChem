'use client';

import React, { useState } from 'react';
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * ImageUploader - Drag-and-drop image uploader with preview
 * Handles S3 upload or base64 encoding
 */
export default function ImageUploader({
  onUpload = async () => {},
  onRemove = () => {},
  preview = null,
  loading = false,
  maxSize = 5, // MB
}) {
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndUpload = async (file) => {
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result;
      await onUpload(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      validateAndUpload(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-border"
          />
          <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
            <button
              type="button"
              onClick={onRemove}
              disabled={loading}
              className="p-3 rounded-full bg-destructive text-white hover:bg-destructive/90 transition disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {!loading && (
            <div className="absolute top-2 right-2 p-2 rounded-full bg-emerald-500/90 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          )}
        </div>
      ) : (
        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition ${
            dragActive
              ? 'border-role-accent bg-role-accent-light/20'
              : 'border-border hover:border-role-accent'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {loading ? (
              <>
                <Loader2 className="h-8 w-8 text-role-accent animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drag image here or click to select</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to {maxSize}MB</p>
              </>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={loading}
          />
        </label>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold">
          {error}
        </div>
      )}
    </div>
  );
}
