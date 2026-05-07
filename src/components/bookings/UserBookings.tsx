import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { BookingCard } from './BookingCard';
import { useAuth } from '../AuthContext';

export const UserBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="text-center py-10 text-slate-400 font-medium">Cargando tus citas...</div>;
  }

  if (bookings.length === 0) {
    return null; // Don't show anything if no bookings
  }

  return (
    <div className="bg-white p-10 rounded-[40px] border border-pink-50 shadow-sm professional-shadow mt-10">
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-10 pl-2 border-l-4 border-primary">Mis Citas Recientes</h3>
      <div className="space-y-4">
        {bookings.map(booking => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
};
