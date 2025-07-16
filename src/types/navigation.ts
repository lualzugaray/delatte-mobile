export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    VerifyEmail: {
      email: string;
      password: string;
      nombre: string;
      apellido: string;
      role: 'client' | 'manager';
    };
    RegisterCafe: undefined;
    ManagerDashboard: undefined;
    ClientHome: undefined;
  };
  