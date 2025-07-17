const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface CafeFormData {
    name: string;
    address: string;
    phone: string;
    email: string;
    instagram?: string;
    menuUrl?: string;
    description: string;
    location: {
        lat: number;
        lng: number;
    };
    categories: string[];
    schedule: Array<{
        day: string;
        open: string;
        close: string;
    }>;
    hasPowerOutlets: boolean;
    isPetFriendly: boolean;
    isDigitalNomadFriendly: boolean;
    gallery: string[];
    coverImage: string;
    suggestedCategories?: string[];
}

export const getCategoriesService = async (): Promise<any[]> => {
    try {
        const response = await fetch(`${API_URL}/categories?type=structural&isActive=true`);

        if (!response.ok) {
            throw new Error('Error al cargar categorías');
        }

        return await response.json();
    } catch (error) {
        throw new Error('Error al cargar categorías');
    }
};

export const createCafeService = async (cafeData: CafeFormData, token: string): Promise<any> => {
    try {
        const response = await fetch(`${API_URL}/managers/me/cafe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(cafeData),
        });

        if (!response.ok) {
            const errorText = await response.text();

            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (parseError) {
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            throw new Error(errorData.error || errorData.message || 'Error al registrar la cafetería');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Error al registrar la cafetería');
    }
};

export const uploadImageToCloudinary = async (imageUri: string): Promise<string> => {
    try {

        const formData = new FormData();

        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('file', {
            uri: imageUri,
            name: `cafe-image.${fileType}`,
            type: `image/${fileType}`,
        } as any);

        formData.append('upload_preset', process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Error al subir imagen');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        throw new Error('Error al subir imagen');
    }
};