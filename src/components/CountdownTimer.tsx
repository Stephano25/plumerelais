// components/CountdownTimer.tsx
import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';

interface Props {
  endTime: string;
  onExpire?: () => void;
}

export default function CountdownTimer({ endTime, onExpire }: Props) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const endDate = new Date(endTime);
    if (isNaN(endDate.getTime())) {
      setTimeLeft('Date invalide');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = endDate.getTime();
      const diff = end - now;
      
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft('Tour terminé');
        onExpire?.();
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  return <Text style={styles.timer}>Temps restant : {timeLeft}</Text>;
}

const styles = StyleSheet.create({
  timer: { fontSize: 16, color: 'red', marginVertical: 8 },
});