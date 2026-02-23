import React, { ReactNode } from 'react';
import './DataTable.css';

export interface DataColumn {
  key: string;
  label: string;
  render?: (
    value: any,
    row: any,
    onCommit: (field: string, value: any, originalValue: any) => void,
    isModified: boolean,
    originalValue: any
  ) => ReactNode;
  width?: string;
}

interface DataTableProps {
  columns: DataColumn[];
  data: any[];
  onRowUpdate?: (rowId: string, updates: Record<string, any>) => Promise<void>;
  onRowDelete?: (rowId: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  canAdd?: boolean;
  onAddClick?: () => void;
  addButtonLabel?: string;
}

interface EditState {
  [rowId: string]: {
    [field: string]: any;
  };
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  onRowUpdate,
  onRowDelete,
  isLoading = false,
  error = null,
  emptyMessage = 'No data available',
  canAdd = false,
  onAddClick,
  addButtonLabel = '+ Add New',
}) => {
  const [editState, setEditState] = React.useState<EditState>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleFieldCommit = (rowId: string, field: string, value: any, originalValue: any) => {
    setEditState((prev) => {
      const nextRowState = { ...(prev[rowId] || {}) };

      if (value === originalValue) {
        delete nextRowState[field];
      } else {
        nextRowState[field] = value;
      }

      if (Object.keys(nextRowState).length === 0) {
        const { [rowId]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [rowId]: nextRowState,
      };
    });
  };

  const isRowModified = (rowId: string): boolean => {
    return Object.keys(editState[rowId] || {}).length > 0;
  };

  const handleSave = async (rowId: string) => {
    if (!onRowUpdate || !isRowModified(rowId)) return;

    setSavingId(rowId);
    try {
      await onRowUpdate(rowId, editState[rowId]);
      setEditState((prev) => {
        const newState = { ...prev };
        delete newState[rowId];
        return newState;
      });
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (rowId: string) => {
    if (!onRowDelete) return;

    setDeletingId(rowId);
    try {
      await onRowDelete(rowId);
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <div className="data-table-loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="data-table-error-card">
        <div className="error-icon">⚠️</div>
        <h3>Unable to Load Data</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="data-table-empty-card">
        <svg className="empty-icon-svg" width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="12" width="48" height="40" rx="2" stroke="#cbd5e0" strokeWidth="2" fill="none"/>
          <line x1="8" y1="20" x2="56" y2="20" stroke="#cbd5e0" strokeWidth="2"/>
          <line x1="16" y1="28" x2="48" y2="28" stroke="#e2e8f0" strokeWidth="2"/>
          <line x1="16" y1="36" x2="48" y2="36" stroke="#e2e8f0" strokeWidth="2"/>
          <line x1="16" y1="44" x2="48" y2="44" stroke="#e2e8f0" strokeWidth="2"/>
        </svg>
        <h3>No Entries Yet</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      {canAdd && (
        <div className="data-table-header">
          <button className="btn-add-primary" onClick={onAddClick}>
            {addButtonLabel}
          </button>
        </div>
      )}

      <div className="data-table">
        <div className="table-row table-header">
          {columns.map((col) => (
            <div key={col.key} className="table-cell table-header-cell">
              {col.label}
            </div>
          ))}
          {(onRowUpdate || onRowDelete) && <div className="table-cell table-header-cell table-action-header" aria-hidden="true"></div>}
        </div>

        <div className="table-body">
          {data.map((row) => (
            <div key={row.id} className="table-row">
              {columns.map((col) => (
                <div key={col.key} className="table-cell">
                  {(() => {
                    const originalValue = row[col.key];
                    const currentValue = editState[row.id]?.[col.key] ?? originalValue;

                    return col.render ? (
                      col.render(
                        currentValue,
                        row,
                        (field, value, original) => handleFieldCommit(row.id, field, value, original),
                        isRowModified(row.id),
                        originalValue
                      )
                    ) : (
                      <span>{currentValue}</span>
                    );
                  })()}
                </div>
              ))}
              {(onRowUpdate || onRowDelete) && (
                <div className="table-cell table-action-cell">
                  {onRowUpdate && (
                    <button
                      className="btn-save-row"
                      onClick={() => handleSave(row.id)}
                      disabled={!isRowModified(row.id) || savingId === row.id}
                      title={!isRowModified(row.id) ? 'No changes to save' : 'Save changes'}
                    >
                      {savingId === row.id ? '...' : 'Save'}
                    </button>
                  )}
                  {onRowDelete && (
                    <button
                      className="btn-delete-row"
                      onClick={() => handleDelete(row.id)}
                      disabled={deletingId === row.id}
                      title="Delete"
                    >
                      {deletingId === row.id ? '...' : '×'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataTable;
