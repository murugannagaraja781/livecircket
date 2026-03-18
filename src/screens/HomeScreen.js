import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import io from 'socket.io-client';
import { CONFIG } from '../api/config';
import { COLORS } from '../theme/colors';
import { Trophy, Calendar, CheckCircle2, ChevronRight } from 'lucide-react-native';
import axios from 'axios';

const socket = io(CONFIG.SOCKET_SERVER);

const MatchCard = ({ match, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardHeader}>
      <Text style={styles.seriesName}>{match.series || 'International Cricket'}</Text>
      <View style={match.live ? styles.liveBadge : styles.finishedBadge}>
        <Text style={styles.badgeText}>{match.live ? 'LIVE' : 'FINISHED'}</Text>
      </View>
    </View>
    
    <View style={styles.teamsContainer}>
      <View style={styles.teamRow}>
        <Text style={styles.teamName}>{match.teams.home}</Text>
        <Text style={styles.scoreText}>{match.score?.home || '0/0'} ({match.score?.overs_home || '0.0'})</Text>
      </View>
      <View style={styles.teamRow}>
        <Text style={styles.teamName}>{match.teams.away}</Text>
        <Text style={styles.scoreText}>{match.score?.away || '0/0'} ({match.score?.overs_away || '0.0'})</Text>
      </View>
    </View>
    
    <View style={styles.cardFooter}>
      <Text style={styles.statusText}>{match.status || 'Match in progress...'}</Text>
      <ChevronRight size={18} color={COLORS.textMuted} />
    </View>
  </TouchableOpacity>
);

export const HomeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('live');
  const [matches, setMatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${CONFIG.SOCKET_SERVER}/matches`);
      const rows = response.data;
      const formatted = rows.map(r => ({ ...r.payload, id: r.id, db_date: r.created_at }));
      setMatches(formatted);
    } catch (e) {
      console.error('Fetch Matches Error', e);
    }
  };

  useEffect(() => {
    fetchMatches();
    socket.on('score_update_global', (data) => {
      setMatches(prev => {
        const idx = prev.findIndex(m => m.id === data.matchId);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...data };
          return updated;
        } else {
          return [data, ...prev];
        }
      });
    });
    return () => socket.off('score_update_global');
  }, []);

  const filteredMatches = matches.filter(m => {
    if (activeTab === 'live') return m.live === true;
    if (activeTab === 'finished') return m.live === false;
    return true; // upcoming logic can be more complex based on date
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>CRIC<Text style={{ color: COLORS.accent }}>X</Text></Text>
        <Trophy size={24} color={COLORS.accent} />
      </View>

      <View style={styles.tabContainer}>
        {['live', 'upcoming', 'finished'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredMatches}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MatchCard 
            match={item} 
            onPress={() => navigation.navigate('MatchDetail', { matchId: item.id })} 
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.secondary },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: COLORS.secondary
  },
  logo: { fontSize: 24, fontWeight: '900', color: COLORS.white, letterSpacing: 1 },
  tabContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 15, 
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  tab: { paddingVertical: 12, paddingHorizontal: 15, marginRight: 10 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.accent },
  tabText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 13 },
  activeTabText: { color: COLORS.white },
  card: { 
    backgroundColor: COLORS.card, 
    margin: 15, 
    marginTop: 0,
    padding: 15, 
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  seriesName: { color: COLORS.textMuted, fontSize: 11, fontWeight: 'bold' },
  liveBadge: { backgroundColor: COLORS.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  finishedBadge: { backgroundColor: COLORS.success, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  teamsContainer: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 15 },
  teamRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  teamName: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  scoreText: { color: COLORS.white, fontSize: 16, fontWeight: '900' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  statusText: { color: COLORS.accent, fontSize: 12, fontStyle: 'italic' }
});
