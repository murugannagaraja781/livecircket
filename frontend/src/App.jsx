import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Trophy, Activity, Calendar, Trophy as TrophyIcon } from 'lucide-react';

const SOCKET_URL = 'http://localhost:4000';

function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');

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

      {loading ? (
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
              <div key={match.id} className="glass match-card">
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
