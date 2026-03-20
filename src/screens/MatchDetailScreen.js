import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Dimensions, View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, Share2, Info, ListChecks, PlayCircle, BarChart2, DollarSign } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { CONFIG } from '../api/config';
import { COLORS } from '../theme/colors';

const screenWidth = Dimensions.get("window").width;
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

  if (!match) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.accent} /><Text style={{color: COLORS.white, marginTop: 10}}>Loading Match Details...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color={COLORS.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{match.teams.home} vs {match.teams.away}</Text>
        <Share2 size={24} color={COLORS.white} />
      </View>

      <View style={styles.scoreBoard}>
        {match.upcoming ? (
          <View style={styles.upcomingContainer}>
            <View style={styles.teamRowLarge}>
               <Text style={styles.teamNameLarge}>{match.teams.home}</Text>
               <Text style={styles.vsTextLarge}>VS</Text>
               <Text style={styles.teamNameLarge}>{match.teams.away}</Text>
            </View>
            <Text style={styles.matchTimeText}>Match starts at {match.status}</Text>
          </View>
        ) : (
          <>
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
          </>
        )}
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
        <TouchableOpacity style={[styles.tab, activeTab === 'graphs' && styles.activeTab]} onPress={() => setActiveTab('graphs')}>
          <BarChart2 size={18} color={activeTab === 'graphs' ? COLORS.accent : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'graphs' && styles.activeTabText]}>GRAPHS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'odds' && styles.activeTab]} onPress={() => setActiveTab('odds')}>
          <DollarSign size={18} color={activeTab === 'odds' ? COLORS.accent : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'odds' && styles.activeTabText]}>ODDS</Text>
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
              <View style={styles.liveContainer}>
                  {/* Batters Table */}
                  <View style={styles.statsCard}>
                      <View style={styles.tableHeader}>
                          <Text style={[styles.columnLabel, {flex: 3}]}>Batter</Text>
                          <Text style={styles.columnLabel}>R</Text>
                          <Text style={styles.columnLabel}>B</Text>
                          <Text style={styles.columnLabel}>4s</Text>
                          <Text style={styles.columnLabel}>6s</Text>
                          <Text style={styles.columnLabel}>SR</Text>
                      </View>
                      {(match.batsmen || []).filter(b => b.out_desc === "" || b.out_desc?.toLowerCase().includes('not out')).map((b, i) => (
                          <View key={i} style={styles.tableRow}>
                              <Text style={[styles.playerText, {flex: 3}]}>{b.name}</Text>
                              <Text style={styles.statText}>{b.runs}</Text>
                              <Text style={styles.statText}>{b.balls}</Text>
                              <Text style={styles.statText}>{b.fours}</Text>
                              <Text style={styles.statText}>{b.sixes}</Text>
                              <Text style={styles.statText}>{b.sr}</Text>
                          </View>
                      ))}
                  </View>

                  {/* Bowlers Table */}
                  <View style={styles.statsCard}>
                      <View style={styles.tableHeader}>
                          <Text style={[styles.columnLabel, {flex: 3}]}>Bowler</Text>
                          <Text style={styles.columnLabel}>O</Text>
                          <Text style={styles.columnLabel}>M</Text>
                          <Text style={styles.columnLabel}>R</Text>
                          <Text style={styles.columnLabel}>W</Text>
                          <Text style={styles.columnLabel}>ER</Text>
                      </View>
                      {(match.bowlers || []).slice(0, 2).map((b, i) => (
                          <View key={i} style={styles.tableRow}>
                              <Text style={[styles.playerText, {flex: 3}]}>{b.name}</Text>
                              <Text style={styles.statText}>{b.overs}</Text>
                              <Text style={styles.statText}>{b.maidens || 0}</Text>
                              <Text style={styles.statText}>{b.runs}</Text>
                              <Text style={styles.statText}>{b.wickets}</Text>
                              <Text style={styles.statText}>{b.econ}</Text>
                          </View>
                      ))}
                  </View>

                  {/* Partnership & Last Wicket */}
                  <View style={styles.infoCard}>
                      <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Partnership</Text>
                          <Text style={styles.infoValue}>{match.partnership || 'N/A'}</Text>
                      </View>
                      {match.last_wicket && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Last Wicket</Text>
                            <Text style={styles.infoValue}>{match.last_wicket}</Text>
                        </View>
                      )}
                  </View>
              </View>
          )}
          {activeTab === 'scorecard' && (
              <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Full Scorecard</Text>
                  {(match.batsmen || []).map((b, i) => (
                      <View key={i} style={styles.scoreRecord}>
                          <View style={{flex: 1}}>
                            <Text style={styles.playerTextScore}>{b.name}</Text>
                            <Text style={styles.outDesc}>{b.out_desc || 'batting'}</Text>
                          </View>
                          <Text style={styles.playerRuns}>{b.runs} ({b.balls})</Text>
                      </View>
                  ))}
              </View>
          )}

          {activeTab === 'graphs' && (
              <View style={styles.liveContainer}>
                  {match.scoreHistory && match.scoreHistory.length >= 2 ? (
                    <>
                      <Text style={styles.infoTitle}>Manhattan (Runs per Over)</Text>
                      <BarChart
                        data={{
                          labels: match.scoreHistory.map(h => h.over),
                          datasets: [{ data: match.scoreHistory.map(h => parseFloat(h.runs || 0)) }]
                        }}
                        width={screenWidth - 30}
                        height={220}
                        yAxisLabel=""
                        chartConfig={chartConfig}
                        verticalLabelRotation={30}
                        style={styles.chart}
                      />
                      
                      <Text style={[styles.infoTitle, {marginTop: 30}]}>Worm Chart</Text>
                      <LineChart
                        data={{
                          labels: match.scoreHistory.map(h => h.over),
                          datasets: [{ data: match.scoreHistory.map(h => parseFloat(h.runs || 0)) }]
                        }}
                        width={screenWidth - 30}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                      />
                    </>
                  ) : (
                      <View style={{padding: 20, alignItems: 'center'}}>
                          <ActivityIndicator size="small" color={COLORS.accent} />
                          <Text style={styles.commentaryText}>Gathering data points... Graphs will appear during live play.</Text>
                      </View>
                  )}
              </View>
          )}

          {activeTab === 'odds' && (
              <View style={styles.liveContainer}>
                  {match.odds ? (
                      (match.odds.type || []).map((type, i) => (
                          <View key={i} style={styles.infoCard}>
                              <Text style={styles.infoTitle}>{type.value}</Text>
                              {(Array.isArray(type.bookmaker) ? type.bookmaker : [type.bookmaker]).slice(0, 3).map((bk, j) => (
                                  <View key={j} style={styles.oddsRow}>
                                      <Text style={styles.bookmakerName}>{bk.name}</Text>
                                      <View style={{flexDirection: 'row'}}>
                                          {(bk.odd || []).map((o, k) => (
                                              <View key={k} style={styles.oddBox}>
                                                  <Text style={styles.oddType}>{o.name[0]}</Text>
                                                  <Text style={styles.oddValue}>{o.value}</Text>
                                              </View>
                                          ))}
                                      </View>
                                  </View>
                              ))}
                          </View>
                      ))
                  ) : (
                      <View style={styles.infoCard}>
                          <Text style={styles.commentaryText}>No market odds available for this match.</Text>
                      </View>
                  )}
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
  tab: { flex: 1, alignItems: 'center', paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 5 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 12, marginLeft: 8 },
  activeTabText: { color: COLORS.accent },
  content: { flex: 1, padding: 15 },
  infoCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 15, marginBottom: 20 },
  infoTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoLabel: { color: COLORS.textMuted, fontSize: 13 },
  infoValue: { color: COLORS.white, fontSize: 13, fontWeight: '600', maxWidth: '60%' },
  commentaryText: { color: COLORS.textMuted, fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  upcomingContainer: { padding: 10, alignItems: 'center' },
  teamRowLarge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  teamNameLarge: { color: COLORS.white, fontSize: 22, fontWeight: '900' },
  vsTextLarge: { color: COLORS.accent, fontSize: 16, fontWeight: '900', marginHorizontal: 20 },
  matchTimeText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600', fontStyle: 'italic' },
  liveContainer: { paddingVertical: 10 },
  statsCard: { backgroundColor: COLORS.card, borderRadius: 15, padding: 15, marginBottom: 15 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 10, marginBottom: 10 },
  columnLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center', flex: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, alignItems: 'center' },
  playerText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  statText: { color: COLORS.white, fontSize: 13, textAlign: 'center', flex: 1 },
  scoreRecord: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  playerTextScore: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  outDesc: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  playerRuns: { color: COLORS.accent, fontSize: 14, fontWeight: '800' },
  chart: { marginVertical: 8, borderRadius: 16 },
  oddsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 10 },
  bookmakerName: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  oddBox: { backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginLeft: 8, alignItems: 'center', minWidth: 40 },
  oddType: { color: COLORS.textMuted, fontSize: 8, fontWeight: '900' },
  oddValue: { color: COLORS.accent, fontSize: 12, fontWeight: '900' }
});

const chartConfig = {
    backgroundGradientFrom: COLORS.primary,
    backgroundGradientTo: COLORS.primary,
    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2, 
    barPercentage: 0.5,
    useShadowColorFromDataset: false 
};
