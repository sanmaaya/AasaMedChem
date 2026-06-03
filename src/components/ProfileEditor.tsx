'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, Building2, Save, X, Loader2 } from 'lucide-react';
import ImageUploader from './ImageUploader';

/**
 * ProfileEditor - User profile editing form
 * Allows users to update their profile information and avatar
 */
export default function ProfileEditor({
  user,
  onSave = async () => {},
  onCancel = () => {},
  loading = false,
}) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    role: user?.role || 'buyer',
    avatar: user?.avatar || '',
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Valid email is required';
    }
    if (formData.phone && !formData.phone.match(/^\+?[\d\s()-]{10,}$/)) {
      newErrors.phone = 'Valid phone number required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageUpload = async (base64, filename) => {
    // In production, upload to S3 and get URL
    setFormData(prev => ({
      ...prev,
      avatar: base64,
    }));
  };

  const handleImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      avatar: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaveLoading(true);
    await onSave(formData);
    setSaveLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Avatar Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Profile Picture</h3>
        <ImageUploader
          preview={formData.avatar}
          onUpload={handleImageUpload}
          onRemove={handleImageRemove}
          maxSize={2}
        />
      </div>

      {/* Personal Info */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-role-accent" />
          Personal Information
        </h3>

        {/* Name */}
        <div>
          <label className="text-xs font-bold text-foreground block mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 transition ${
              errors.name ? 'border-destructive' : 'border-border'
            }`}
            placeholder="John Doe"
            disabled={loading}
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-bold text-foreground block mb-2">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 transition ${
              errors.email ? 'border-destructive' : 'border-border'
            }`}
            placeholder="john@example.com"
            disabled={loading}
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-bold text-foreground block mb-2">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 transition ${
              errors.phone ? 'border-destructive' : 'border-border'
            }`}
            placeholder="+91 9876543210"
            disabled={loading}
          />
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
        </div>
      </div>

      {/* Organization Info */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-role-accent" />
          Organization
        </h3>

        {/* Company */}
        <div>
          <label className="text-xs font-bold text-foreground block mb-2">Company Name</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-role-primary/40 transition"
            placeholder="Your Company Ltd."
            disabled={loading}
          />
        </div>

        {/* Role (Read-only) */}
        <div>
          <label className="text-xs font-bold text-foreground block mb-2">Role</label>
          <div className="px-3 py-2 rounded-lg border border-border bg-secondary/40 text-foreground text-sm capitalize font-semibold">
            {formData.role}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Contact admin to change your role
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || saveLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary transition disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || saveLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-role-primary text-role-primary-foreground font-semibold hover:bg-role-primary/90 transition disabled:opacity-50"
        >
          {saveLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
