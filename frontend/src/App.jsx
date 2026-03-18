import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Trophy, Activity, Calendar, Trophy as TrophyIcon } from 'lucide-react';

const SOCKET_URL = 'http://localhost:4000'; // Change to Render URL after deployment

function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

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

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '5rem' }}>
          <div className="badge-live badge">Loading Scores...</div>
        </div>
      ) : (
        <div className="card-grid">
          {matches.map((match) => (
            <div key={match.id} className="glass match-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                  {match.series}
                </span>
                <span className={`badge ${match.live ? 'badge-live' : 'badge-finished'}`}>
                  {match.live ? 'LIVE' : 'FINISHED'}
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
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
