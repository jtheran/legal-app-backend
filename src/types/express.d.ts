declare global {
    namespace Express {
      interface User {
        id: string;
        email: string;
        name: string;
        dni: string;
        role: 'ADMIN' | 'LAWYER';
      }
    }
  }