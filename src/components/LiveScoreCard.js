import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import io from 'socket.io-client';
import { CONFIG } from '../api/config';

const socket = io(CONFIG.SOCKET_SERVER);

export const LiveScoreCard = () => {
  const [score, setScore] = useState({ runs: 0, wickets: 0, overs: '0.0', team: 'WAITING...' });

  useEffect(() => {
    socket.on('score_update', (data) => setScore(data));
    return () => socket.off('score_update');
  }, []);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>LIVE LINE - FASTEST UPDATES</Text>
      <View style={styles.row}>
         <Text style={styles.score}>{score.runs}/{score.wickets}</Text>
         <Text style={styles.overs}>({score.overs})</Text>
      </View>
      <Text style={styles.status}>Data Source: Statpal Enabled</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#0f172a', padding: 25, borderRadius: 20, margin: 15 },
  title: { color: '#f59e0b', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'baseline' },
  score: { color: '#ffffff', fontSize: 48, fontWeight: '900' },
  overs: { color: '#94a3b8', fontSize: 20, marginLeft: 10 },
  status: { color: '#22c55e', fontSize: 10, marginTop: 10, fontWeight: 'bold' }
});
