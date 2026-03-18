import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import io from 'socket.io-client';
import { CONFIG } from '../api/config';
import { COLORS } from '../theme/colors';
import { ArrowLeft, Share2, Info, ListChecks, PlayCircle } from 'lucide-react-native';
import axios from 'axios';

const socket = io(CONFIG.SOCKET_SERVER);

export const MatchDetailScreen = ({ route, navigation }) => {
  const { matchId } = route.params;
  const [match, setMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  const fetchDetail = async () => {
    try {
      const response = await axios.get(`${CONFIG.SOCKET_SERVER}/history/${matchId}`);
      if (response.data && response.data.payload) {
        setMatch(response.data.payload);
      }
    } catch (e) {
      console.error('Fetch Detail Error', e);
    }
  };

  useEffect(() => {
    fetchDetail();
    socket.emit('subscribe', { matchId });
    socket.on('score_update', (data) => {
      setMatch(prev => ({ ...prev, ...data }));
    });
    return () => {
      socket.emit('unsubscribe', { matchId });
      socket.off('score_update');
    };
  }, [matchId]);

  if (!match) return <View style={styles.loading}><Text style={{color: COLORS.white}}>Loading...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color={COLORS.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{match.teams.home} vs {match.teams.away}</Text>
        <Share2 size={24} color={COLORS.white} />
      </View>

      <View style={styles.scoreBoard}>
         <View style={styles.scoreRow}>
             <View style={styles.teamInfo}>
                 <Text style={styles.teamNameMain}>{match.teams.home}</Text>
                 <Text style={styles.scoreMain}>{match.score.home || '0/0'}</Text>
                 <Text style={styles.oversMain}>({match.score.overs_home || '0.0'})</Text>
             </View>
             <View style={styles.vsContainer}>
                 <Text style={styles.vsText}>VS</Text>
             </View>
             <View style={styles.teamInfo}>
                 <Text style={styles.teamNameMain}>{match.teams.away}</Text>
                 <Text style={styles.scoreMain}>{match.score.away || '0/0'}</Text>
                 <Text style={styles.oversMain}>({match.score.overs_away || '0.0'})</Text>
             </View>
         </View>
         <View style={styles.statusBanner}>
            <Text style={styles.statusMainText}>{match.status}</Text>
         </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'info' && styles.activeTab]} onPress={() => setActiveTab('info')}>
          <Info size={18} color={activeTab === 'info' ? COLORS.accent : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>INFO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'live' && styles.activeTab]} onPress={() => setActiveTab('live')}>
          <PlayCircle size={18} color={activeTab === 'live' ? COLORS.accent : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'live' && styles.activeTabText]}>LIVE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'scorecard' && styles.activeTab]} onPress={() => setActiveTab('scorecard')}>
          <ListChecks size={18} color={activeTab === 'scorecard' ? COLORS.accent : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'scorecard' && styles.activeTabText]}>SCORECARD</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
          {activeTab === 'info' && (
              <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Match Info</Text>
                  <View style={styles.infoRow}><Text style={styles.infoLabel}>Series</Text><Text style={styles.infoValue}>{match.series}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoLabel}>Status</Text><Text style={styles.infoValue}>{match.status}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoLabel}>Venue</Text><Text style={styles.infoValue}>TBD</Text></View>
              </View>
          )}
          {activeTab === 'live' && (
              <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Live Commentary</Text>
                  <Text style={styles.commentaryText}>Real-time commentary will appear here...</Text>
              </View>
          )}
          {activeTab === 'scorecard' && (
              <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Full Scorecard</Text>
                  <Text style={styles.commentaryText}>Detailed player statistics coming soon...</Text>
              </View>
          )}
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.secondary },
  loading: { flex: 1, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  scoreBoard: { backgroundColor: COLORS.primary, margin: 15, padding: 20, borderRadius: 20 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamInfo: { alignItems: 'center', flex: 1 },
  teamNameMain: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 5 },
  scoreMain: { color: COLORS.white, fontSize: 28, fontWeight: '900' },
  oversMain: { color: COLORS.textMuted, fontSize: 14 },
  vsContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  vsText: { color: COLORS.accent, fontWeight: '900', fontSize: 12 },
  statusBanner: { marginTop: 20, backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  statusMainText: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.secondary, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 15, flexDirection: 'row', justifyContent: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 12, marginLeft: 8 },
  activeTabText: { color: COLORS.accent },
  content: { flex: 1, padding: 15 },
  infoCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 15, marginBottom: 20 },
  infoTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoLabel: { color: COLORS.textMuted, fontSize: 13 },
  infoValue: { color: COLORS.white, fontSize: 13, fontWeight: '600', maxWidth: '60%' },
  commentaryText: { color: COLORS.textMuted, fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }
});
