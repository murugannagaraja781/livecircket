import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, RefreshControl, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMatches } from '../redux/matchesSlice';
import { CONFIG } from '../api/config';
import { COLORS } from '../theme/colors';
import { Trophy, Calendar, CheckCircle2, ChevronRight, LogOut } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

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
  const { logout } = useContext(AuthContext);
  const dispatch = useDispatch();
  const { live, upcoming, finished, loading } = useSelector(state => state.matches);
  const [activeTab, setActiveTab] = useState('live');
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => logout(), style: 'destructive' }
      ]
    );
  };

  useEffect(() => {
    dispatch(fetchMatches());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMatches());
    setRefreshing(false);
  };

  const filteredMatches = activeTab === 'live' ? live : activeTab === 'upcoming' ? upcoming : finished;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>CRIC<Text style={{ color: COLORS.accent }}>X</Text></Text>
        <View style={styles.headerRight}>
          <Trophy size={24} color={COLORS.accent} style={styles.trophyIcon} />
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={22} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trophyIcon: {
    marginRight: 15,
  },
  logoutButton: {
    padding: 5,
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
