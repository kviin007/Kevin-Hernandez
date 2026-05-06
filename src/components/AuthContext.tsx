import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, data: { displayName: string, phone: string, address: string }) => Promise<void>;
  updatePasswordDirectly: (newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const isAdminEmail = user.email === 'admin@yuliedplay.com' || user.email === 'hernandezkevin001998@gmail.com';
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            // Force admin role if email matches master list
            if (isAdminEmail && data.role !== 'admin') {
              data.role = 'admin';
              setProfile({ ...data, role: 'admin' });
              // Silently try to update DB, don't block if rules prevent it yet
              setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true }).catch(err => {
                console.warn("Could not update role in DB, but local admin enabled:", err);
              });
            } else {
              setProfile(data);
            }
          } else {
            // Check if this is a master admin email before defaulting to 'user'
            const newProfile = {
              email: user.email,
              displayName: user.displayName || 'Usuario',
              photoURL: user.photoURL,
              role: isAdminEmail ? 'admin' : 'user',
              points: isAdminEmail ? 999999 : 0,
              createdAt: serverTimestamp()
            };
            setProfile(newProfile);
            await setDoc(doc(db, 'users', user.uid), newProfile).catch(err => {
              console.error("Error creating profile:", err);
            });
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const login = async (emailInput: string, pass: string) => {
    // Basic validation
    if (!emailInput || !pass) throw new Error('Por favor completa todos los campos.');
    
    let email = emailInput;
    let password = pass;

    // Special handling for "admin" username
    if (emailInput.toLowerCase() === 'admin' && pass === 'admin') {
      email = 'admin@yuliedplay.com';
      password = 'admin_password_123'; // Use a valid length password for Firebase
    }

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      // Ensure role is admin if magic credentials used
      if (emailInput.toLowerCase() === 'admin' && pass === 'admin') {
        const adminData = {
          role: 'admin',
          displayName: 'Administrador Master'
        };
        await setDoc(doc(db, 'users', res.user.uid), adminData, { merge: true });
        await setDoc(doc(db, 'admins', res.user.uid), { active: true, email: email, level: 'superadmin' });
      }
    } catch (err: any) {
      if (emailInput.toLowerCase() === 'admin' && pass === 'admin' && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
        // Bootstrap admin if doesn't exist
        try {
          const res = await createUserWithEmailAndPassword(auth, email, password);
          // Ensure profile is created as admin
          const adminProfile = {
            email: email,
            displayName: 'Administrador',
            role: 'admin',
            points: 999999,
            createdAt: serverTimestamp()
          };
          await setDoc(doc(db, 'users', res.user.uid), adminProfile);
          await setDoc(doc(db, 'admins', res.user.uid), { active: true, email: email });
        } catch (createErr: any) {
           throw err;
        }
      } else {
        throw err;
      }
    }
  };

  const signup = async (email: string, pass: string, extraData: { displayName: string, phone: string, address: string }) => {
    if (!email.includes('@')) throw new Error('Correo electrónico inválido.');
    if (pass.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, 'users', res.user.uid), {
      email,
      displayName: extraData.displayName,
      phone: extraData.phone,
      address: extraData.address,
      role: 'user',
      points: 0,
      createdAt: serverTimestamp()
    });
  };

  const updatePasswordDirectly = async (newPass: string) => {
    if (!auth.currentUser) throw new Error("No hay usuario autenticado.");
    await updatePassword(auth.currentUser, newPass);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin: profile?.role === 'admin',
      loginWithGoogle, 
      logout, 
      resetPassword,
      login,
      signup,
      updatePasswordDirectly
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
