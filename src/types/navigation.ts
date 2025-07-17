export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    RegisterCafe: undefined;

    AppTabs: undefined;
    Home: undefined;
    Explore: { category?: string; q?: string } | undefined;
    Map: undefined;
    Profile: undefined;
    MyCafe: undefined;
    Dashboard: undefined;

    CafeDetails: { cafeId: string };
};

export type TabParamList = {
    Home: undefined;
    Explore: { category?: string; q?: string } | undefined;
    Map: undefined;
    Profile: undefined;
    MyCafe: undefined;
};

export interface CafeLocation {
    lat: number;
    lng: number;
}

export interface UserLocation {
    latitude: number;
    longitude: number;
}

export interface Cafe {
    _id: string;
    name: string;
    description?: string;
    coverImage?: string;
    gallery?: string[];
    averageRating?: number;
    reviewsCount?: number;
    address?: string;
    location?: CafeLocation;
    categories?: string[];
    amenities?: string[];
    priceRange?: string;
    openingHours?: {
        [key: string]: {
            open: string;
            close: string;
            isOpen: boolean;
        };
    };
}

export interface ExploreFilters {
    selectedCategorias?: string[];
    ratingMin?: number;
    sortBy?: string;
    openNow?: boolean;
}

declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
}

export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'client' | 'manager' | 'admin';
    bio?: string;
    profileImage?: string;
    socialLinks?: {
        instagram?: string;
        twitter?: string;
        website?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    _id: string;
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Location {
    lat: number;
    lng: number;
}

export interface Schedule {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

export interface DaySchedule {
    open?: string;
    close?: string;
    isClosed: boolean;
}

export interface Review {
    _id: string;
    cafeId: string;
    clientId?: User;
    rating: number;
    comment: string;
    image?: string;
    categories?: Category[];
    isVisible: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export interface ReviewFormData {
    rating: number;
    comment: string;
    image?: string;
    selectedCategoryIds: string[];
    newCategoryNames: string[];
}

export interface LoginFormData {
    email: string;
    password: string;
}

export interface RegisterFormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface ApiError {
    message: string;
    code?: string;
    status?: number;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    loading: boolean;
}

export interface Favorite {
    _id: string;
    clientId: string;
    cafeId: string;
    createdAt: string;
}

export interface SearchFilters extends ExploreFilters {
    query?: string;
    location?: {
        latitude: number;
        longitude: number;
        radius?: number;
    };
}

export interface CafeCardProps {
    cafe: Cafe;
    onPress?: () => void;
    showFavoriteButton?: boolean;
}

export interface ReviewCardProps {
    review: Review;
    onUserPress?: (userId: string) => void;
}

export interface FilterModalProps {
    visible: boolean;
    currentFilters: ExploreFilters;
    onApply: (filters: ExploreFilters) => void;
    onClose: () => void;
}

export type AsyncFunction<T = void> = () => Promise<T>;
export type AsyncFunctionWithParam<T, P = any> = (param: P) => Promise<T>;

export const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;
export const SORT_OPTIONS = [
    { value: 'name', label: 'Nombre A-Z' },
    { value: 'rating', label: 'Mejor calificación' },
    { value: 'newest', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
] as const;

export type RatingOption = typeof RATING_OPTIONS[number];
export type SortOption = typeof SORT_OPTIONS[number]['value'];