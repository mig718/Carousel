import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flow } from '../types';
import { flowService } from '../services/userService';
import './FlowsPage.css';

type SortKey = 'name-asc' | 'name-desc' | 'states-desc' | 'states-asc';

const FlowsPage: React.FC = () => {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('name-asc');

  const loadFlows = async () => {
    setLoading(true);
    try {
      const data = await flowService.getFlows();
      setFlows(data || []);
    } catch (err: any) {
      setFlows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlows();
  }, []);

  const sortedFlows = useMemo(() => {
    const list = [...flows];
    switch (sortBy) {
      case 'name-desc':
        return list.sort((left, right) => right.name.localeCompare(left.name));
      case 'states-desc':
        return list.sort((left, right) => (right.states?.length || 0) - (left.states?.length || 0));
      case 'states-asc':
        return list.sort((left, right) => (left.states?.length || 0) - (right.states?.length || 0));
      case 'name-asc':
      default:
        return list.sort((left, right) => left.name.localeCompare(right.name));
    }
  }, [flows, sortBy]);

  if (loading) {
    return <div className="flows-loading">Loading flows...</div>;
  }

  return (
    <div className="flows-dashboard-page">
      {flows.length === 0 ? (
        <section className="flows-empty-state">
          <div className="flows-empty-graphic">
            <div className="flows-empty-illustration" aria-hidden="true">
              <div className="flows-empty-blob blob-a" />
              <div className="flows-empty-blob blob-b" />
              <div className="flows-empty-blob blob-c" />
              <div className="flows-empty-blob blob-d" />
              <div className="flows-empty-geom geom-square" />
              <div className="flows-empty-geom geom-diamond" />
              <div className="flows-empty-geom geom-circle" />
              <div className="flows-empty-stroke stroke-a" />
              <div className="flows-empty-stroke stroke-b" />
              <div className="flows-empty-stroke stroke-c" />
              <div className="flows-empty-stroke stroke-d" />
              <div className="flows-empty-fade" />
            </div>
            <button type="button" className="flows-empty-create-btn" onClick={() => navigate('/flows/create')}>
              Create Flow
            </button>
          </div>
        </section>
      ) : (
        <section className="flows-cards-section">
          <div className="flows-sort-row">
            <label htmlFor="flow-sort">Sort</label>
            <select id="flow-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="states-desc">Most states first</option>
              <option value="states-asc">Fewest states first</option>
            </select>
          </div>

          <div className="flows-card-grid">
            {sortedFlows.slice(0, 32).map((flow) => (
              <article key={flow.id} className="flow-card" onClick={() => navigate(`/flows/create?flowId=${flow.id}`)}>
                <h3>{flow.name}</h3>
                <p>{flow.description || 'No description'}</p>
                <div className="flow-card-meta">
                  <span>States: {flow.states?.length || 0}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FlowsPage;
