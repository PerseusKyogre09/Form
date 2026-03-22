import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '$env/dynamic/private';

const CLOUDINARY_CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME || "placeholder";
const CLOUDINARY_API_KEY = env.CLOUDINARY_API_KEY || "placeholder";
const CLOUDINARY_API_SECRET = env.CLOUDINARY_API_SECRET || "placeholder";

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

export const POST: RequestHandler = async ({ request }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bucketPath = formData.get('path') as string;

        if (!file) {
            return json({ error: 'Missing file' }, { status: 400 });
        }

        // Check if credentials are configured
        if (CLOUDINARY_CLOUD_NAME === "placeholder" || CLOUDINARY_API_KEY === "placeholder") {
            console.error('Cloudinary credentials not configured');
            return json({ error: 'Upload service not configured' }, { status: 500 });
        }

        // Convert file to buffer/bytes
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('Uploading file with path:', bucketPath);

        // Upload directly using Cloudinary's upload method
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { 
                    folder: 'quill', 
                    public_id: bucketPath.split('.')[0],
                    resource_type: 'auto'
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', JSON.stringify(error));
                        reject(error);
                    } else {
                        console.log('Cloudinary upload success:', result?.public_id);
                        resolve(result);
                    }
                }
            ).end(buffer);
        });

        const url = (uploadResult as any).secure_url;

        // Return the secure Cloudinary URL
        return json({ url });
    } catch (error: any) {
        console.error('Error uploading file:', error.message || error);
        return json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
};
