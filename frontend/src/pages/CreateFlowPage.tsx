import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateFlowActionRequest, FlowActionTemplate } from '../types';
import { flowService } from '../services/userService';
import './CreateFlowPage.css';

type DraftState = {
  key: string;
  name: string;
  color: string;
};

const STATE_OPTIONS = [
  { name: 'Draft', color: '#64748b' },
  { name: 'Review', color: '#f59e0b' },
  { name: 'Approved', color: '#10b981' },
  { name: 'Rejected', color: '#ef4444' },
  { name: 'In Progress', color: '#6366f1' },
  { name: 'Completed', color: '#0ea5e9' },
  { name: 'On Hold', color: '#a855f7' },
];

const CreateFlowPage: React.FC = () => {
  const navigate = useNavigate();
  const statePickerRef = React.useRef<HTMLDivElement | null>(null);
  const createStatePopoverRef = React.useRef<HTMLDivElement | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCreateStatePopover, setShowCreateStatePopover] = useState(false);
  const [newStateName, setNewStateName] = useState('');
  const [states, setStates] = useState<DraftState[]>([]);
  const [templates, setTemplates] = useState<FlowActionTemplate[]>([]);
  const [selectedTemplateIdsByState, setSelectedTemplateIdsByState] = useState<Record<string, string[]>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveErrorMessage = (err: any, fallback: string): string => {
    const responseMessage = err?.response?.data?.message;
    const directMessage = err?.message;
    const text = responseMessage || directMessage || String(err || '');
    if (!text || text === '[object Object]') {
      return fallback;
    }
    return text;
  };

  React.useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const data = await flowService.getActionTemplates();
        setTemplates(data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to load action templates.');
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  React.useEffect(() => {
    if (!showStatePicker && !showCreateStatePopover) {
      return;
    }

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (statePickerRef.current && !statePickerRef.current.contains(target)) {
        setShowStatePicker(false);
        setShowStateDropdown(false);
        setShowCreateStatePopover(false);
        setNewStateName('');
        return;
      }

      if (showCreateStatePopover && createStatePopoverRef.current && !createStatePopoverRef.current.contains(target)) {
        setShowCreateStatePopover(false);
        setNewStateName('');
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [showStatePicker, showCreateStatePopover]);

  const availableStateOptions = useMemo(() => {
    return STATE_OPTIONS.filter(
      (option) => !states.some((state) => state.name.toLowerCase() === option.name.toLowerCase())
    );
  }, [states]);

  const addState = (stateName: string, color: string) => {
    if (states.some((state) => state.name.toLowerCase() === stateName.toLowerCase())) {
      setError('State already exists.');
      return;
    }

    const key = `${stateName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const next = [...states, { key, name: stateName, color }];
    setStates(next);
    setSelectedTemplateIdsByState((prev) => ({ ...prev, [key]: [] }));
    setError(null);
  };

  const handleCreateState = () => {
    const trimmed = newStateName.trim();
    if (!trimmed) {
      setError('State name is required.');
      return;
    }

    addState(trimmed, '#7c3aed');
    setShowStateDropdown(false);
    setNewStateName('');
    setShowCreateStatePopover(false);
    setShowStatePicker(false);
  };

  const handleAddExistingState = (stateName: string, color: string) => {
    addState(stateName, color);
    setShowStateDropdown(false);
    setShowCreateStatePopover(false);
    setShowStatePicker(false);
  };

  const toggleTemplate = (stateKey: string, templateId: string) => {
    setSelectedTemplateIdsByState((prev) => {
      const current = prev[stateKey] || [];
      const exists = current.includes(templateId);
      return {
        ...prev,
        [stateKey]: exists ? current.filter((id) => id !== templateId) : [...current, templateId],
      };
    });
  };

  const removeState = (stateKey: string) => {
    setStates((prev) => prev.filter((state) => state.key !== stateKey));
    setSelectedTemplateIdsByState((prev) => {
      const next = { ...prev };
      delete next[stateKey];
      return next;
    });
  };

  const handleCreateFlow = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Flow name is required.');
      return;
    }

    if (states.length === 0) {
      setError('Add at least one state.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await flowService.createFlow({ name: name.trim(), description: description.trim() || undefined });

      const createdStates = [] as { draft: DraftState; id: string }[];
      for (let i = 0; i < states.length; i += 1) {
        const draft = states[i];
        const createdState = await flowService.addState(created.id, {
          name: draft.name,
          color: draft.color,
          sortOrder: i + 1,
        });
        createdStates.push({ draft, id: createdState.id });
      }

      for (const createdState of createdStates) {
        const selectedTemplateIds = selectedTemplateIdsByState[createdState.draft.key] || [];
        for (const templateId of selectedTemplateIds) {
          const template = templates.find((item) => item.id === templateId);
          if (!template) {
            continue;
          }

          const request: CreateFlowActionRequest = {
            name: template.name,
            actionType: template.actionType,
            awaitable: template.awaitable,
            requiresApproval: template.requiresApproval,
            approvalType: template.approvalType,
            approvalRole: template.approvalRole,
            predefined: template.predefined,
          };

          await flowService.addAction(created.id, createdState.id, request);
        }
      }

      navigate('/flows');
    } catch (err: any) {
      setError(resolveErrorMessage(err, 'Unable to create flow.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="create-flow-page">
      <form className="create-flow-form" onSubmit={handleCreateFlow}>
        <section className="create-flow-section">
          <h2>Flow Details</h2>
          <input
            required
            placeholder="Flow name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <textarea
            placeholder="Description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </section>

        <section className="create-flow-section">
          <h2>Add States</h2>
          <div className={`create-flow-state-sequence ${states.length === 0 ? 'is-empty' : ''}`}>
            {states.map((state, index) => (
              <React.Fragment key={state.key}>
                {index > 0 && <span className="create-flow-state-arrow" aria-hidden="true">→</span>}
                <div className="create-flow-state-node">
                  <button
                    type="button"
                    className="create-flow-state-node-remove"
                    onClick={() => removeState(state.key)}
                    aria-label={`Remove ${state.name}`}
                  >
                    ×
                  </button>
                  <div
                    className="create-flow-state-node-icon"
                    style={{ borderColor: state.color, backgroundColor: state.color }}
                  >
                    <span className="create-flow-state-node-dot" style={{ backgroundColor: state.color }} />
                    <span className="create-flow-state-node-initial">{state.name.slice(0, 1).toUpperCase()}</span>
                  </div>
                  <span className="create-flow-state-node-label">{state.name}</span>
                </div>
              </React.Fragment>
            ))}

            <button
              type="button"
              className="create-flow-add-state-tile"
              onClick={() => {
                setShowStatePicker(true);
                setShowStateDropdown(false);
                setError(null);
              }}
            >
              + Add State
            </button>
          </div>

          {showStatePicker && (
            <div className="create-flow-state-picker" ref={statePickerRef}>
              <div className="create-flow-state-picker-header">
                <h3>Select State</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowStatePicker(false);
                    setShowStateDropdown(false);
                    setShowCreateStatePopover(false);
                    setNewStateName('');
                  }}
                  aria-label="Close state picker"
                >
                  ×
                </button>
              </div>

              <div className="create-flow-state-picker-row">
                <div className="create-flow-state-dropdown">
                  <button
                    type="button"
                    className="create-flow-state-dropdown-trigger"
                    onClick={() => setShowStateDropdown((prev) => !prev)}
                    disabled={availableStateOptions.length === 0}
                  >
                    <span className="create-flow-state-dropdown-value">
                      {availableStateOptions.length > 0 ? 'Select existing state' : 'No states available'}
                    </span>
                    <span className="create-flow-state-dropdown-caret">▾</span>
                  </button>

                  {showStateDropdown && availableStateOptions.length > 0 && (
                    <div className="create-flow-state-dropdown-menu">
                      {availableStateOptions.map((option) => (
                        <button
                          type="button"
                          key={option.name}
                          className="create-flow-state-dropdown-item"
                          onClick={() => handleAddExistingState(option.name, option.color)}
                        >
                          <span className="create-flow-swatch" style={{ backgroundColor: option.color }} />
                          <span>{option.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="create-flow-create-state-wrap" ref={createStatePopoverRef}>
                  <button
                    type="button"
                    className="create-flow-create-state-btn"
                    onClick={() => {
                      setShowCreateStatePopover((prev) => !prev);
                      setShowStateDropdown(false);
                      setError(null);
                    }}
                  >
                    + Create State
                  </button>

                  {showCreateStatePopover && (
                    <div className="create-flow-create-state-popover">
                      <input
                        placeholder="State name"
                        value={newStateName}
                        onChange={(event) => setNewStateName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            handleCreateState();
                          }
                        }}
                        autoFocus
                      />
                      <div className="create-flow-create-state-popover-actions">
                        <button type="button" onClick={handleCreateState}>Add</button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            setShowCreateStatePopover(false);
                            setNewStateName('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="create-flow-section">
          <div className="create-flow-actions-header">
            <h2>Select Actions per State</h2>
            <button type="button" className="create-flow-link-btn" onClick={() => navigate('/flows/actions')}>
              Manage Actions
            </button>
          </div>

          {loadingTemplates ? (
            <p className="create-flow-muted">Loading actions...</p>
          ) : (
            <div className="create-flow-state-actions-grid">
              {states.map((state) => (
                <article key={state.key} className="create-flow-state-actions-card">
                  <h3>{state.name}</h3>
                  {(templates || []).map((template) => {
                    const checked = (selectedTemplateIdsByState[state.key] || []).includes(template.id);
                    return (
                      <label key={`${state.key}-${template.id}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTemplate(state.key, template.id)}
                        />
                        <span>{template.name} ({template.actionType})</span>
                      </label>
                    );
                  })}
                </article>
              ))}
            </div>
          )}
        </section>

        {error && <div className="error-message">{error}</div>}

        <div className="create-flow-actions">
          <button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Flow'}</button>
        </div>
      </form>
    </div>
  );
};

export default CreateFlowPage;
