import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatchDetail } from '../redux/matchesSlice';
import { Dimensions, View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, Share2, Info, ListChecks, PlayCircle, BarChart2, DollarSign, ChevronRight, Activity, TrendingUp } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { COLORS } from '../theme/colors';

const screenWidth = Dimensions.get("window").width;

export const MatchDetailScreen = ({ route, navigation }) => {
  const { matchId } = route.params;
  const dispatch = useDispatch();
  const match = useSelector(state => state.matches.details[matchId] || state.matches.live.find(m => m.id === matchId) || state.matches.upcoming.find(m => m.id === matchId) || state.matches.finished.find(m => m.id === matchId));
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    dispatch(fetchMatchDetail(matchId));
  }, [dispatch, matchId]);

  if (!match) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.accent} /><Text style={{color: COLORS.white, marginTop: 10}}>Loading Match Details...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color={COLORS.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{match?.teams?.home || 'Team'} vs {match?.teams?.away || 'Team'}</Text>
        <Share2 size={24} color={COLORS.white} />
      </View>

      <View style={styles.scoreBoard}>
        {match?.upcoming ? (
          <View style={styles.upcomingContainer}>
            <View style={styles.teamRowLarge}>
               <Text style={styles.teamNameLarge}>{match?.teams?.home || 'Team A'}</Text>
               <Text style={styles.vsTextLarge}>VS</Text>
               <Text style={styles.teamNameLarge}>{match?.teams?.away || 'Team B'}</Text>
            </View>
            <Text style={styles.matchTimeText}>Match starts at {match?.status || 'TBD'}</Text>
          </View>
        ) : (
          <>
            <View style={styles.scoreRow}>
                <View style={styles.teamInfo}>
                    <Text style={styles.teamNameMain}>{match?.teams?.home || 'Team A'}</Text>
                    <Text style={styles.scoreMain}>{match?.score?.home || '0/0'}</Text>
                    <Text style={styles.oversMain}>({match?.score?.overs_home || '0.0'})</Text>
                </View>
                <View style={styles.vsContainer}>
                    <Text style={styles.vsText}>VS</Text>
                </View>
                <View style={styles.teamInfo}>
                    <Text style={styles.teamNameMain}>{match?.teams?.away || 'Team B'}</Text>
                    <Text style={styles.scoreMain}>{match?.score?.away || '0/0'}</Text>
                    <Text style={styles.oversMain}>({match?.score?.overs_away || '0.0'})</Text>
                </View>
            </View>
            <View style={styles.statusBanner}>
               <Text style={styles.statusMainText}>{match?.status || 'Match in progress...'}</Text>
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
                  <View style={styles.infoRow}><Text style={styles.infoLabel}>Series</Text><Text style={styles.infoValue}>{match?.series || 'N/A'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoLabel}>Status</Text><Text style={styles.infoValue}>{match?.status || 'N/A'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoLabel}>Venue</Text><Text style={styles.infoValue}>TBD</Text></View>
              </View>
          )}
          {activeTab === 'live' && (
              <View style={styles.liveContainer}>
                  {/* Over Timeline */}
                  <View style={styles.timelineContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineScroll}>
                      <Text style={styles.overLabel}>Over {Math.floor((parseFloat(match?.score?.overs_home || '0.0')))}</Text>
                      {(match?.recent_balls || []).map((ball, idx) => {
                        if (ball?.toString().startsWith('Over')) {
                          return <Text key={idx} style={styles.overMarkerText}>{ball}</Text>;
                        }
                        return (
                          <View key={idx} style={[
                            styles.ballBadge,
                            ball === '4' && styles.fourBadge,
                            ball === '6' && styles.sixBadge,
                            (ball === 'W' || ball?.toString().includes('W')) && styles.wicketBadge
                          ]}>
                            <Text style={styles.ballText}>{ball}</Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Metrics Row */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>CRR</Text>
                      <Text style={styles.metricValue}>{match?.crr || '0.00'}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>RRR</Text>
                      <Text style={styles.metricValue}>{match?.rrr || '0.00'}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Target</Text>
                      <Text style={styles.metricValue}>{match?.target || '--'}</Text>
                    </View>
                  </View>

                  {/* Batters Table */}
                  <View style={styles.statsCard}>
                      <View style={styles.tableHeader}>
                          <Text style={[styles.columnLabel, {flex: 3, textAlign: 'left'}]}>Batter</Text>
                          <Text style={styles.columnLabel}>R(B)</Text>
                          <Text style={styles.columnLabel}>4s</Text>
                          <Text style={styles.columnLabel}>6s</Text>
                          <Text style={styles.columnLabel}>SR</Text>
                      </View>
                      {(match?.batsmen || []).map((b, i) => (
                          <View key={i} style={styles.tableRow}>
                              <Text style={[styles.playerText, {flex: 3}]}>{b?.name || 'Batter'}</Text>
                              <Text style={styles.statText}>{b?.runs ?? 0}({b?.balls ?? 0})</Text>
                              <Text style={styles.statText}>{b?.fours ?? 0}</Text>
                              <Text style={styles.statText}>{b?.sixes ?? 0}</Text>
                              <Text style={styles.statText}>{b?.sr ?? 0}</Text>
                          </View>
                      ))}
                  </View>

                  {/* Bowlers Table */}
                  <View style={styles.statsCard}>
                      <View style={styles.tableHeader}>
                          <Text style={[styles.columnLabel, {flex: 3, textAlign: 'left'}]}>Bowler</Text>
                          <Text style={styles.columnLabel}>W-R</Text>
                          <Text style={styles.columnLabel}>Ov</Text>
                          <Text style={styles.columnLabel}>Eco</Text>
                      </View>
                      {(match?.bowlers || []).map((b, i) => (
                          <View key={i} style={styles.tableRow}>
                              <Text style={[styles.playerText, {flex: 3}]}>{b?.name || 'Bowler'}</Text>
                              <Text style={styles.statText}>{b?.wickets ?? 0}-{b?.runs ?? 0}</Text>
                              <Text style={styles.statText}>{b?.overs || '0.0'}</Text>
                              <Text style={styles.statText}>{b?.econ || '0.0'}</Text>
                          </View>
                      ))}
                  </View>

                  {/* Partnership */}
                  <View style={styles.infoCard}>
                      <View style={styles.infoRowFlat}>
                          <Text style={styles.infoLabel}>Partnership: {match?.partnership || '5 (8)'}</Text>
                      </View>
                  </View>
              </View>
          )}
          {activeTab === 'scorecard' && (
              <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Full Scorecard</Text>
                  {(match?.batsmen || []).map((b, i) => (
                      <View key={i} style={styles.scoreRecord}>
                          <View style={{flex: 1}}>
                            <Text style={styles.playerTextScore}>{b?.name || 'Batter'}</Text>
                            <Text style={styles.outDesc}>{b?.out_desc || 'batting'}</Text>
                          </View>
                          <Text style={styles.playerRuns}>{b?.runs ?? 0} ({b?.balls ?? 0})</Text>
                      </View>
                  ))}
              </View>
          )}

          {activeTab === 'graphs' && (
              <View style={styles.liveContainer}>
                  {/* Innings Toggle */}
                  <View style={styles.inningsToggleRow}>
                    <TouchableOpacity style={[styles.inningBtn, styles.activeInningBtn]}>
                        <Text style={styles.activeInningText}>1st Inns</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.inningBtn}>
                        <Text style={styles.inningText}>2nd Inns</Text>
                    </TouchableOpacity>
                  </View>

                  {match?.scoreHistory && match.scoreHistory.length >= 2 ? (
                    <>
                      <View style={styles.graphCardPremium}>
                        <View style={styles.graphHeader}>
                            <Text style={styles.graphTitleCompact}>Score Progression</Text>
                            <TouchableOpacity><Text style={styles.fullScreenText}>Full Screen</Text></TouchableOpacity>
                        </View>
                        <LineChart
                          data={{
                            labels: match.scoreHistory.filter((_, i) => i % 5 === 0).map(h => h.over),
                            datasets: [{ 
                              data: match.scoreHistory.map(h => parseFloat(h.runs || 0)),
                              color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Team NZ color from screen
                            }]
                          }}
                          width={screenWidth - 40}
                          height={180}
                          chartConfig={chartConfigPremium}
                          bezier
                          style={styles.chart}
                        />
                      </View>
                      
                      <TouchableOpacity style={styles.expandableRow}>
                        <Text style={styles.expandableLabel}>Manhattan</Text>
                        <ChevronRight color={COLORS.textMuted} size={20} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.expandableRow}>
                        <Text style={styles.expandableLabel}>Worm</Text>
                        <ChevronRight color={COLORS.textMuted} size={20} />
                      </TouchableOpacity>
                    </>
                  ) : (
                      <View style={{padding: 40, alignItems: 'center'}}>
                          <ActivityIndicator size="small" color={COLORS.accent} />
                          <Text style={styles.commentaryText}>Gathering graph data...</Text>
                      </View>
                  )}
              </View>
          )}

          {activeTab === 'odds' && (
              <View style={styles.liveContainer}>
                  {match?.odds ? (
                      (match.odds.type || []).map((type, i) => (
                          <View key={i} style={styles.infoCard}>
                              <Text style={styles.infoTitle}>{type.value}</Text>
                              {(Array.isArray(type?.bookmaker) ? type.bookmaker : type?.bookmaker ? [type.bookmaker] : []).slice(0, 3).map((bk, j) => (
                                  <View key={j} style={styles.oddsRow}>
                                      <Text style={styles.bookmakerName}>{bk?.name || 'Bookmaker'}</Text>
                                      <View style={{flexDirection: 'row'}}>
                                          {(bk?.odd || bk?.odds || []).map((o, k) => (
                                              <View key={k} style={styles.oddBox}>
                                                  <Text style={styles.oddType}>{o?.name?.[0] || '?'}</Text>
                                                  <Text style={styles.oddValue}>{o?.value || '-'}</Text>
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
  statusBanner: { marginTop: 15, backgroundColor: 'rgba(245, 158, 11, 0.05)', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  statusMainText: { color: "#f59e0b", fontSize: 13, fontWeight: '700' },
  
  timelineContainer: { marginBottom: 15, paddingVertical: 12, backgroundColor: COLORS.card, borderRadius: 15 },
  timelineScroll: { paddingHorizontal: 15, alignItems: 'center' },
  overLabel: { color: COLORS.textMuted, marginRight: 15, fontWeight: '800', fontSize: 13 },
  ballBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  fourBadge: { backgroundColor: '#2563eb' },
  sixBadge: { backgroundColor: '#7c3aed' },
  wicketBadge: { backgroundColor: '#dc2626' },
  ballText: { color: COLORS.white, fontWeight: '900', fontSize: 12 },
  overMarkerText: { color: COLORS.white, marginHorizontal: 15, fontWeight: 'bold', fontSize: 13 },

  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, backgroundColor: COLORS.card, padding: 15, borderRadius: 15 },
  metricItem: { alignItems: 'center', flex: 1 },
  metricLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  metricValue: { color: COLORS.white, fontSize: 15, fontWeight: '800' },

  infoRowFlat: { alignItems: 'center', paddingVertical: 5 },
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
  inningsToggleRow: { flexDirection: 'row', gap: 10, marginBottom: 20, paddingHorizontal: 5 },
  inningBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.card, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  activeInningBtn: { backgroundColor: '#1d4ed8', borderColor: '#3b82f6' },
  inningText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 13 },
  activeInningText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },

  graphCardPremium: { backgroundColor: COLORS.card, borderRadius: 15, padding: 15, marginBottom: 15 },
  graphHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  graphTitleCompact: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  fullScreenText: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },
  
  expandableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: 18, borderRadius: 15, marginBottom: 10 },
  expandableLabel: { color: COLORS.white, fontSize: 14, fontWeight: '700' },

  chart: { marginVertical: 8, borderRadius: 16 }
});

const chartConfigPremium = {
  backgroundGradientFrom: COLORS.card,
  backgroundGradientTo: COLORS.card,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
  strokeWidth: 2,
  propsForDots: { r: "3", strokeWidth: "1", stroke: "#ef4444" },
  decimalPlaces: 0
};

const chartConfig = {
    backgroundGradientFrom: COLORS.primary,
    backgroundGradientTo: COLORS.primary,
    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2, 
    barPercentage: 0.5,
    useShadowColorFromDataset: false 
};
