import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Trophy, Activity, Calendar, Trophy as TrophyIcon, BarChart as ChartIcon, LineChart as LineIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SOCKET_URL = 'http://localhost:4000';

function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await axios.get(`${SOCKET_URL}/matches`);
        setMatches(res.data.map(m => m.payload));
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setLoading(false);
      }
    };

    fetchMatches();

    const socket = io(SOCKET_URL);
    socket.on('score_update_global', (data) => {
      setMatches((prev) => {
        const index = prev.findIndex((m) => m.id === data.id);
        if (index !== -1) {
          const newMatches = [...prev];
          newMatches[index] = data;
          return newMatches;
        }
        return [data, ...prev];
      });
      // Update selected match if it's the one receiving the update
      setSelectedMatch(prev => prev && prev.id === data.id ? data : prev);
    });

    return () => socket.disconnect();
  }, []);

  const filteredMatches = matches.filter(m => {
    if (activeTab === 'live') return m.live;
    if (activeTab === 'finished') return m.finished;
    if (activeTab === 'upcoming') return m.upcoming;
    return true;
  });

  const getBadgeClass = (m) => {
    if (m.live) return 'badge-live';
    if (m.finished) return 'badge-finished';
    if (m.upcoming) return 'badge-upcoming';
    return '';
  };

  const getStatusText = (m) => {
    if (m.live) return 'LIVE';
    if (m.finished) return 'FINISHED';
    if (m.upcoming) return 'UPCOMING';
    return '';
  };

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>CRIC<span style={{ color: '#f59e0b' }}>X</span> LIVE</h1>
          <p style={{ color: '#94a3b8' }}>Real-time professional cricket data dashboard</p>
        </div>
        <div className="glass" style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
          <Activity color="#22c55e" />
          <span>Server: Online</span>
        </div>
      </header>

      <div className="tabs">
        <button className={`tab ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
          <Activity size={16} /> LIVE
        </button>
        <button className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
          <Calendar size={16} /> UPCOMING
        </button>
        <button className={`tab ${activeTab === 'finished' ? 'active' : ''}`} onClick={() => setActiveTab('finished')}>
          <TrophyIcon size={16} /> FINISHED
        </button>
      </div>

      {selectedMatch ? (
        <div className="match-detail glass">
          <button className="tab" onClick={() => setSelectedMatch(null)} style={{ marginBottom: '1rem' }}>
            ← Back to List
          </button>
          <div className="detail-header">
            <h2>{selectedMatch.teams.home} vs {selectedMatch.teams.away}</h2>
            <p className="status">{selectedMatch.status}</p>
          </div>
          
          <div className="grid-2-col">
            <div className="stats-section glass">
              <h3>Live Batters</h3>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Batter</th>
                    <th>R</th>
                    <th>B</th>
                    <th>4s</th>
                    <th>6s</th>
                    <th>SR</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedMatch.batsmen || []).filter(b => b.out_desc === "" || b.out_desc?.toLowerCase().includes('not out')).map((b, i) => (
                    <tr key={i}>
                      <td>{b.name}</td>
                      <td>{b.runs}</td>
                      <td>{b.balls}</td>
                      <td>{b.fours}</td>
                      <td>{b.sixes}</td>
                      <td>{b.sr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="stats-section glass">
              <h3>Live Bowler</h3>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Bowler</th>
                    <th>O</th>
                    <th>M</th>
                    <th>R</th>
                    <th>W</th>
                    <th>ER</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedMatch.bowlers || []).slice(0, 2).map((b, i) => (
                    <tr key={i}>
                      <td>{b.name}</td>
                      <td>{b.overs}</td>
                      <td>{b.maidens || 0}</td>
                      <td>{b.runs}</td>
                      <td>{b.wickets}</td>
                      <td>{b.econ}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid-2-col" style={{ marginTop: '1rem' }}>
             <div className="glass" style={{ padding: '1rem' }}>
                <h4>Partnership</h4>
                <p>{selectedMatch.partnership || 'N/A'}</p>
             </div>
             {selectedMatch.last_wicket && (
               <div className="glass" style={{ padding: '1rem' }}>
                  <h4>Last Wicket</h4>
                  <p>{selectedMatch.last_wicket}</p>
               </div>
             )}
          </div>

          {/* Market Odds */}
          {selectedMatch.odds && (
            <div className="stats-section glass" style={{ marginTop: '1rem' }}>
              <h3>Market Odds</h3>
              <div className="odds-grid">
                {(selectedMatch.odds.type || []).map((type, i) => (
                  <div key={i} className="market-group">
                    <h4 style={{ color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{type.value}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                      {(Array.isArray(type.bookmaker) ? type.bookmaker : [type.bookmaker]).slice(0, 3).map((bk, j) => (
                        <div key={j} className="glass" style={{ padding: '0.75rem', minWidth: '150px' }}>
                          <p style={{ fontSize: '0.6rem', color: '#94a3b8', margin: 0 }}>{bk.name}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                            {(bk.odd || []).map((o, k) => (
                              <div key={k} style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: '0.5rem', display: 'block' }}>{o.name === 'Home' ? 'H' : o.name === 'Away' ? 'A' : 'D'}</span>
                                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.8rem' }}>{o.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manhattan & Worm Graphs */}
          <div className="grid-2-col" style={{ marginTop: '1rem' }}>
            <div className="stats-section glass" style={{ height: '300px' }}>
              <h3>Manhattan (Runs per Over)</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={selectedMatch.scoreHistory || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="over" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="runs" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="stats-section glass" style={{ height: '300px' }}>
              <h3>Worm (Cumulative Score)</h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={selectedMatch.scoreHistory || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="over" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="runs" stroke="var(--secondary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--secondary)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', marginTop: '5rem' }}>
          <div className="badge-live badge">Loading Scores...</div>
        </div>
      ) : (
        <div className="card-grid">
          {filteredMatches.length === 0 ? (
            <div className="glass" style={{ padding: '3rem', gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8' }}>
              No matches found in this category.
            </div>
          ) : (
            filteredMatches.map((match) => (
              <div key={match.id} className="glass match-card" onClick={() => setSelectedMatch(match)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                    {match.series}
                  </span>
                  <span className={`badge ${getBadgeClass(match)}`}>
                    {getStatusText(match)}
                  </span>
                </div>

                <div className="team-row">
                  <span className="team-name">{match.teams.home}</span>
                  <span className="score">{match.score.home}</span>
                </div>
                <div className="team-row">
                  <span className="team-name">{match.teams.away}</span>
                  <span className="score">{match.score.away}</span>
                </div>

                <div className="status">
                  {match.status}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;
