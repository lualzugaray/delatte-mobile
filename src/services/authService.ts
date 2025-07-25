const API = process.env.EXPO_PUBLIC_API_URL!;
const AUTH0 = `https://${process.env.EXPO_PUBLIC_AUTH0_DOMAIN}`;

export const registerUser = async (data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    role: 'client' | 'manager';
}) => {
    const res = await fetch(`${AUTH0}/dbconnections/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID,
            email: data.email,
            password: data.password,
            connection: 'Username-Password-Authentication',
            name: `${data.nombre} ${data.apellido}`,
        }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.description || 'Error al registrar usuario');
    }

    return true;
};

export const loginUser = async (email: string, password: string) => {
    const res = await fetch(`${API}/auth0-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en login');

    return {
        email,
        role: await fetchUserRole(data.access_token),
        emailVerified: true,
        token: data.access_token,
    };
};

export const fetchUserRole = async (token: string) => {
    const res = await fetch(`${API}/users/role`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error obteniendo rol');
    return data.role as 'client' | 'manager';
};

export const syncUser = async (data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    role: 'client' | 'manager';
}) => {
    const loginRes = await fetch(`${API}/auth0-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.error || 'Error obteniendo token');

    const token = loginData.access_token;

    const endpoint = data.role === 'manager' ? '/sync-manager' : '/sync-client';
    const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            email: data.email,
            firstName: data.nombre,
            lastName: data.apellido,
            profilePicture: '',
        }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error sincronizando usuario');
    }
};
