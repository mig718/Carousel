import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlowActionTemplate } from '../types';
import { flowService } from '../services/userService';
import './FlowActionsPage.css';

const FlowActionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<FlowActionTemplate[]>([]);
  const [name, setName] = useState('');
  const [actionType, setActionType] = useState('CUSTOM');
  const [awaitable, setAwaitable] = useState(true);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approvalType, setApprovalType] = useState('');
  const [approvalRole, setApprovalRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await flowService.getActionTemplates();
      setTemplates(data || []);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load actions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await flowService.createActionTemplate({
        name,
        actionType,
        awaitable,
        requiresApproval,
        approvalType: approvalType || undefined,
        approvalRole: approvalRole || undefined,
      });
      setName('');
      setActionType('CUSTOM');
      setAwaitable(true);
      setRequiresApproval(false);
      setApprovalType('');
      setApprovalRole('');
      await loadTemplates();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to create action template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flow-actions-page">
      <section className="flow-actions-card">
        <div className="flow-actions-header">
          <h2>Manage Actions</h2>
          <button type="button" onClick={() => navigate('/flows/create')}>Back to Create Flow</button>
        </div>

        <form className="flow-actions-form" onSubmit={handleCreate}>
          <input required placeholder="Action name" value={name} onChange={(event) => setName(event.target.value)} />
          <input required placeholder="Action type" value={actionType} onChange={(event) => setActionType(event.target.value)} />
          <div className="flow-actions-row">
            <label>
              <input type="checkbox" checked={awaitable} onChange={(event) => setAwaitable(event.target.checked)} />
              Awaitable
            </label>
            <label>
              <input type="checkbox" checked={requiresApproval} onChange={(event) => setRequiresApproval(event.target.checked)} />
              Requires approval
            </label>
          </div>
          <div className="flow-actions-row">
            <input placeholder="Approval type" value={approvalType} onChange={(event) => setApprovalType(event.target.value)} />
            <input placeholder="Approval role" value={approvalRole} onChange={(event) => setApprovalRole(event.target.value)} />
          </div>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create Action'}</button>
        </form>

        {error && <div className="error-message">{error}</div>}

        <div className="flow-actions-list">
          {loading ? (
            <p>Loading actions...</p>
          ) : (
            templates.map((template) => (
              <article key={template.id} className="flow-template-item">
                <h3>{template.name}</h3>
                <p>{template.actionType}</p>
                <small>
                  {template.awaitable ? 'Awaitable' : 'Immediate'}
                  {template.requiresApproval ? ` · Approval: ${template.approvalType || 'REQUIRED'}` : ' · No approval'}
                </small>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default FlowActionsPage;
