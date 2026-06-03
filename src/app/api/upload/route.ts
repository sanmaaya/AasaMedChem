import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  const session = await auth();

  // Authentication check
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'seller')) {
    return NextResponse.json({ error: 'Unauthorized. Admin or Seller role required.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique, sanitized filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}_${sanitizedName}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Ensure target folder exists
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/${filename}`;
    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error('Upload handler error:', err);
    return NextResponse.json({ error: 'Failed to process file upload.' }, { status: 500 });
  }
}
