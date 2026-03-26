import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import io from 'socket.io-client';
import { CONFIG } from '../api/config';

const socket = io(CONFIG.SOCKET_SERVER);

import { useSelector } from 'react-redux';

export const LiveScoreCard = () => {
  const liveMatches = useSelector(state => state.matches.live);
  const [score, setScore] = useState({ runs: 0, wickets: 0, overs: '0.0', team: 'WAITING...' });

  useEffect(() => {
    socket.on('score_update_global', (data) => setScore(data));
    return () => socket.off('score_update_global');
  }, []);

  // Fallback to Redux data if no socket updates received yet or if team is WAITING
  const displayScore = score.team === 'WAITING...' && liveMatches.length > 0 ? {
    runs: liveMatches[0].score?.home?.split('/')[0] || 0,
    wickets: liveMatches[0].score?.home?.split('/')[1] || 0,
    overs: liveMatches[0].score?.overs_home || '0.0',
    team: liveMatches[0].teams?.home || 'Team'
  } : score;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>LIVE LINE - FASTEST UPDATES</Text>
      <View style={styles.row}>
         <Text style={styles.score}>{displayScore.runs}/{displayScore.wickets}</Text>
         <Text style={styles.overs}>({displayScore.overs})</Text>
      </View>
      <Text style={styles.status}>Data Source: {score.team === 'WAITING...' ? 'Fallback Enabled' : 'Live StatStream'}</Text>
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
