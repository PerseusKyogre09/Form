import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '$env/dynamic/private';
const CLOUDINARY_CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = env.CLOUDINARY_API_SECRET;
import streamifier from 'streamifier';

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

export const POST: RequestHandler = async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bucketPath = formData.get('path') as string;

        if (!file) {
            return json({ error: 'Missing file' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary via stream
        const uploadResult = await new Promise((resolve, reject) => {
            const cld_upload_stream = cloudinary.uploader.upload_stream(
                { folder: 'quill', public_id: bucketPath.split('.')[0] },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            streamifier.createReadStream(buffer).pipe(cld_upload_stream);
        });

        const url = (uploadResult as any).secure_url;

        // Return the secure Cloudinary URL
        return json({ url });
    } catch (error: any) {
        console.error('Error uploading file:', error);
        return json({ error: error.message }, { status: 500 });
    }
};
