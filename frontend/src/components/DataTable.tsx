import React, { ReactNode } from 'react';
import './DataTable.css';

export interface CellRenderContext {
  rowId: string;
  field: string;
  isEditing: boolean;
  beginEdit: () => void;
  endEdit: () => void;
  setFieldValidity: (isValid: boolean) => void;
  hasChanged: boolean;
  isValid: boolean;
  moveToNextField: () => void;
  moveToPreviousField: () => void;
}

export interface DataColumn {
  key: string;
  label: string;
  dataKey?: string;
  displayKey?: string;
  displayValue?: (dataValue: any, row: any) => any;
  render?: (
    value: any,
    row: any,
    onCommit: (field: string, value: any, originalValue: any) => void,
    isModified: boolean,
    originalValue: any,
    context: CellRenderContext
  ) => ReactNode;
  width?: string;
  required?: boolean; // Indicates if this is a required field
}

interface DataTableProps {
  columns: DataColumn[];
  data: any[];
  onRowUpdate?: (rowId: string, updates: Record<string, any>) => Promise<void>;
  onRowCreate?: (data: any) => Promise<string>; // Returns the new row ID
  onRowDelete?: (rowId: string) => Promise<void>;
  canDeleteRow?: (row: any) => boolean;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  canAdd?: boolean;
  onAddClick?: () => void;
  addButtonLabel?: string;
  newRowDefaults?: Record<string, any>; // Default values for new rows
}

interface EditState {
  [rowId: string]: {
    [field: string]: any;
  };
}

interface ValidationState {
  [rowId: string]: {
    [field: string]: boolean; // true = valid, false = invalid
  };
}

export interface DataTableHandle {
  addNewRow: () => void;
}

const DataTable = React.forwardRef<DataTableHandle, DataTableProps>(({
  columns,
  data,
  onRowUpdate,
  onRowCreate,
  onRowDelete,
  canDeleteRow,
  isLoading = false,
  error = null,
  emptyMessage = 'No data available',
  canAdd = false,
  onAddClick,
  addButtonLabel = 'Add',
  newRowDefaults = {},
}, ref) => {
  const [editState, setEditState] = React.useState<EditState>({});
  const [validationState, setValidationState] = React.useState<ValidationState>({});
  const [activeCell, setActiveCell] = React.useState<{ rowId: string; field: string } | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [savingAllId, setSavingAllId] = React.useState<boolean>(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [newRowCounter, setNewRowCounter] = React.useState<number>(0);
  const [newRows, setNewRows] = React.useState<string[]>([]); // Track temp IDs
  const [rowSaveFailures, setRowSaveFailures] = React.useState<Record<string, boolean>>({});
  const [deleteToast, setDeleteToast] = React.useState<string | null>(null);
  const deleteToastTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (deleteToastTimeoutRef.current !== null) {
        window.clearTimeout(deleteToastTimeoutRef.current);
      }
    };
  }, []);

  const showDeleteToast = () => {
    setDeleteToast('Deleted successfully');
    if (deleteToastTimeoutRef.current !== null) {
      window.clearTimeout(deleteToastTimeoutRef.current);
    }

    deleteToastTimeoutRef.current = window.setTimeout(() => {
      setDeleteToast(null);
      deleteToastTimeoutRef.current = null;
    }, 2200);
  };

  const isCellEditing = (rowId: string, field: string) => {
    return activeCell?.rowId === rowId && activeCell?.field === field;
  };

  const beginCellEdit = (rowId: string, field: string) => {
    setActiveCell({ rowId, field });
  };

  const endCellEdit = (rowId: string, field: string) => {
    setActiveCell((prev) => {
      if (!prev) return prev;
      if (prev.rowId !== rowId || prev.field !== field) return prev;
      return null;
    });
  };

  const handleFieldCommit = (rowId: string, field: string, value: any, originalValue: any) => {
    setRowSaveFailures((prev) => {
      if (!prev[rowId]) return prev;
      const next = { ...prev };
      delete next[rowId];
      return next;
    });

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

  const setFieldValidity = (rowId: string, field: string, isValid: boolean) => {
    setValidationState((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [field]: isValid,
      },
    }));
  };

  React.useImperativeHandle(ref, () => ({
    addNewRow: () => {
      const tempId = `__NEW_${newRowCounter}`;
      setNewRowCounter(prev => prev + 1);
      setNewRows(prev => [...prev, tempId]);
      
      // Add the new row to edit state with default values
      setEditState(prev => ({
        ...prev,
        [tempId]: { ...newRowDefaults },
      }));
      
      // Initialize validation state for all fields
      setValidationState(prev => {
        const fieldValidations: Record<string, boolean> = {};
        columns.forEach(col => {
          const hasDefault = newRowDefaults[col.key] !== undefined && newRowDefaults[col.key] !== '';
          // Optional fields should not block save when empty.
          // Required fields are valid only when they have a non-empty default value.
          fieldValidations[col.key] = col.required ? hasDefault : true;
        });
        return {
          ...prev,
          [tempId]: fieldValidations,
        };
      });
      
      // Start editing the first field of the new row
      if (columns.length > 0) {
        setActiveCell({ rowId: tempId, field: columns[0].key });
      }
    },
  }), [newRowCounter, columns, newRowDefaults]);

  const isRowModified = (rowId: string): boolean => {
    return Object.keys(editState[rowId] || {}).length > 0;
  };

  const isRowValid = (rowId: string): boolean => {
    const validations = validationState[rowId] || {};
    const edits = editState[rowId] || {};
    
    // All edited fields must be valid
    return Object.keys(edits).every(field => validations[field] !== false);
  };

  const hasAnyChanges = (): boolean => {
    return Object.keys(editState).length > 0;
  };

  const hasAnyInvalidChanges = (): boolean => {
    for (const rowId of Object.keys(editState)) {
      if (!isRowValid(rowId)) {
        return true;
      }
    }
    return false;
  };

  const hasRetryRows = (): boolean => {
    return Object.keys(rowSaveFailures).length > 0;
  };

  const handleSave = async (rowId: string) => {
    if (!isRowModified(rowId) || !isRowValid(rowId)) return;

    // Check if this is a new row
    const isNewRow = rowId.startsWith('__NEW_');
    
    if (isNewRow && !onRowCreate) {
      console.error('onRowCreate callback not provided for new row');
      return;
    }
    
    if (!isNewRow && !onRowUpdate) {
      console.error('onRowUpdate callback not provided for existing row');
      return;
    }

    setSavingId(rowId);
    try {
      if (isNewRow) {
        // Create new row
        await onRowCreate!(editState[rowId]);
        setNewRows(prev => prev.filter(id => id !== rowId));
      } else {
        // Update existing row
        await onRowUpdate!(rowId, editState[rowId]);
      }
      
      setActiveCell(null);
      setEditState((prev) => {
        const newState = { ...prev };
        delete newState[rowId];
        return newState;
      });
      setValidationState((prev) => {
        const newState = { ...prev };
        delete newState[rowId];
        return newState;
      });
      setRowSaveFailures((prev) => {
        if (!prev[rowId]) return prev;
        const next = { ...prev };
        delete next[rowId];
        return next;
      });
    } catch (err) {
      console.error('Failed to save:', err);
      setRowSaveFailures((prev) => ({ ...prev, [rowId]: true }));
      if (columns.length > 0) {
        setActiveCell({ rowId, field: columns[0].key });
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAll = async () => {
    if (!hasAnyChanges() || hasAnyInvalidChanges()) return;
    if (!onRowUpdate && !onRowCreate) return;

    setSavingAllId(true);
    const savedRowIds: string[] = [];
    let failingRowId: string | null = null;
    try {
      const rowIds = Object.keys(editState);
      for (const rowId of rowIds) {
        if (!isRowValid(rowId)) {
          continue;
        }

        const isNewRow = rowId.startsWith('__NEW_');
        if (isNewRow) {
          if (!onRowCreate) {
            throw new Error('onRowCreate callback not provided for new row');
          }
          failingRowId = rowId;
          await onRowCreate(editState[rowId]);
        } else {
          if (!onRowUpdate) {
            throw new Error('onRowUpdate callback not provided for existing row');
          }
          failingRowId = rowId;
          await onRowUpdate(rowId, editState[rowId]);
        }

        savedRowIds.push(rowId);
      }

      if (savedRowIds.length > 0) {
        setEditState((prev) => {
          const next = { ...prev };
          savedRowIds.forEach((rowId) => delete next[rowId]);
          return next;
        });

        setValidationState((prev) => {
          const next = { ...prev };
          savedRowIds.forEach((rowId) => delete next[rowId]);
          return next;
        });

        setRowSaveFailures((prev) => {
          const next = { ...prev };
          savedRowIds.forEach((rowId) => delete next[rowId]);
          return next;
        });

        setNewRows((prev) => prev.filter((rowId) => !savedRowIds.includes(rowId)));
      }

      if (savedRowIds.length === rowIds.length) {
        setActiveCell(null);
      }
    } catch (err) {
      console.error('Failed to save all:', err);
      if (failingRowId) {
        setRowSaveFailures((prev) => ({ ...prev, [failingRowId as string]: true }));
        if (columns.length > 0) {
          setActiveCell({ rowId: failingRowId, field: columns[0].key });
        }
      }
    } finally {
      setSavingAllId(false);
    }
  };

  const handleDelete = async (rowId: string) => {
    const isNewRow = rowId.startsWith('__NEW_');
    
    // For new rows, just remove from display without server call
    if (isNewRow) {
      setNewRows(prev => prev.filter(id => id !== rowId));
      setEditState(prev => {
        const newState = { ...prev };
        delete newState[rowId];
        return newState;
      });
      setValidationState(prev => {
        const newState = { ...prev };
        delete newState[rowId];
        return newState;
      });
      return;
    }
    
    // For existing rows, call server delete
    if (!onRowDelete) return;

    setDeletingId(rowId);
    try {
      await onRowDelete(rowId);
      showDeleteToast();
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

  if (data.length === 0 && newRows.length === 0) {
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
        {canAdd && (
          <button
            className="btn-empty-create"
            onClick={onAddClick}
            title={`Add a new ${addButtonLabel.toLowerCase()}`}
          >
            {addButtonLabel}
          </button>
        )}
      </div>
    );
  }

  // Combine new rows (at top) with existing data
  const displayData = [
    ...newRows.map(tempId => ({
      id: tempId,
      ...newRowDefaults,
      ...editState[tempId],
    })),
    ...data
  ];

  return (
    <div className="data-table-container">
      <div className="data-table">
        <div className="table-row table-header">
          {columns.map((col) => (
            <div key={col.key} className="table-cell table-header-cell">
              {col.label}
              {col.required && <span className="required-indicator" title="Required field">*</span>}
            </div>
          ))}
          {(onRowUpdate || onRowCreate) && <div className="table-cell table-header-cell table-action-header" aria-hidden="true"></div>}
        </div>

        <div className="table-body">
          {displayData.map((row) => (
            <div key={row.id} className="table-row">
              {columns.map((col) => (
                <div key={col.key} className="table-cell">
                  {(() => {
                    const dataKey = col.dataKey ?? col.key;
                    const displayKey = col.displayKey ?? dataKey;
                    const originalValue = row[dataKey];
                    const currentValue = editState[row.id]?.[col.key] ?? originalValue;
                    // For new rows, show validation for all fields (they're "being filled")
                    // For existing rows, only show validation for fields that have been modified
                    const isNewRow = row.id.startsWith('__NEW_');
                    const hasChanged = isNewRow || editState[row.id]?.[col.key] !== undefined;
                    const isFieldValid = validationState[row.id]?.[col.key] !== false;
                    const currentDisplayValue = col.displayValue
                      ? col.displayValue(currentValue, row)
                      : (displayKey === dataKey ? currentValue : row[displayKey]);
                    
                    const currentColIndex = columns.findIndex(c => c.key === col.key);
                    
                    const context: CellRenderContext = {
                      rowId: row.id,
                      field: col.key,
                      isEditing: isCellEditing(row.id, col.key),
                      beginEdit: () => beginCellEdit(row.id, col.key),
                      endEdit: () => endCellEdit(row.id, col.key),
                      setFieldValidity: (isValid: boolean) => setFieldValidity(row.id, col.key, isValid),
                      hasChanged,
                      isValid: isFieldValid,
                      moveToNextField: () => {
                        if (currentColIndex < columns.length - 1) {
                          const nextField = columns[currentColIndex + 1].key;
                          endCellEdit(row.id, col.key);
                          beginCellEdit(row.id, nextField);
                        }
                      },
                      moveToPreviousField: () => {
                        if (currentColIndex > 0) {
                          const prevField = columns[currentColIndex - 1].key;
                          endCellEdit(row.id, col.key);
                          beginCellEdit(row.id, prevField);
                        }
                      },
                    };

                    return col.render ? (
                      col.render(
                        currentValue,
                        row,
                        (field, value, original) => {
                          handleFieldCommit(row.id, field, value, original);
                        },
                        isRowModified(row.id),
                        originalValue,
                        context
                      )
                    ) : (
                      <span>{currentDisplayValue}</span>
                    );
                  })()}
                </div>
              ))}
              {(onRowUpdate || onRowCreate) && (
                <div className="table-cell table-action-cell">
                  {(() => {
                    const isNewRow = row.id.startsWith('__NEW_');
                    const canDeleteExisting = canDeleteRow ? canDeleteRow(row) : true;
                    const canDelete = isNewRow || canDeleteExisting;

                    return (
                      <>
                  {((row.id.startsWith('__NEW_') && onRowCreate) || (!row.id.startsWith('__NEW_') && onRowUpdate)) && (
                    <button
                      className={`btn-save-row ${rowSaveFailures[row.id] ? 'is-retry' : ''}`}
                      onClick={() => handleSave(row.id)}
                      disabled={!isRowModified(row.id) || !isRowValid(row.id) || savingId === row.id}
                      title={!isRowModified(row.id) ? 'No changes to save' : isRowValid(row.id) ? (rowSaveFailures[row.id] ? 'Retry save' : 'Save changes') : 'Cannot save: invalid changes'}
                    >
                      {savingId === row.id ? '...' : rowSaveFailures[row.id] ? 'Retry' : 'Save'}
                    </button>
                  )}
                  <button
                    className="btn-delete-row"
                    onClick={() => handleDelete(row.id)}
                    disabled={!canDelete || deletingId === row.id}
                    title={
                      row.id.startsWith('__NEW_')
                        ? 'Cancel'
                        : canDelete
                          ? 'Delete'
                          : 'Deletion is not allowed for this row'
                    }
                  >
                    {deletingId === row.id ? '...' : '×'}
                  </button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {(canAdd || onRowUpdate || onRowCreate) && (
        <div className="data-table-footer">
          {canAdd && (
            <button
              className="btn-add-primary"
              onClick={onAddClick}
              title="Add a new row"
            >
              {addButtonLabel}
            </button>
          )}

          {(onRowUpdate || onRowCreate) && (
            <button
              className="btn-save-all"
              onClick={handleSaveAll}
              disabled={!hasAnyChanges() || hasAnyInvalidChanges() || hasRetryRows() || savingAllId}
              title={
                !hasAnyChanges() 
                  ? 'No changes to save' 
                  : hasAnyInvalidChanges() 
                    ? 'Cannot save: invalid changes exist' 
                    : hasRetryRows()
                      ? 'Resolve row save errors first (Retry rows)'
                      : 'Save all changes'
              }
            >
              {savingAllId ? '...' : 'Save All'}
            </button>
          )}
        </div>
      )}

      {deleteToast && (
        <div className="data-table-toast" role="status" aria-live="polite">
          {deleteToast}
        </div>
      )}
    </div>
  );
});

DataTable.displayName = 'DataTable';

export default DataTable;
