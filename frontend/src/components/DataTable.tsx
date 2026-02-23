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
  isLoading = false,
  error = null,
  emptyMessage = 'No data available',
  canAdd = false,
  onAddClick,
  addButtonLabel = '+ Add New',
}) => {
  const [editState, setEditState] = React.useState<EditState>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);

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
        <div className="empty-icon">📋</div>
        <h3>No Data Yet</h3>
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
          {onRowUpdate && <div className="table-cell table-header-cell table-action-header" aria-hidden="true"></div>}
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
              {onRowUpdate && (
                <div className="table-cell table-action-cell">
                  <button
                    className="btn-save-row"
                    onClick={() => handleSave(row.id)}
                    disabled={!isRowModified(row.id) || savingId === row.id}
                    title={!isRowModified(row.id) ? 'No changes to save' : 'Save changes'}
                  >
                    {savingId === row.id ? '...' : 'Save'}
                  </button>
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
