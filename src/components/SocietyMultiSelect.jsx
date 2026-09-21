import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

/**
 * SocietyMultiSelect
 * Dropdown with search and multiselect checkboxes for assigning multiple societies to a branch.
 */
const SocietyMultiSelect = ({
  societies = [],
  selected = [],
  onChange,
  placeholder = 'Select societies...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSocieties = societies.filter((soc) =>
    soc.toLowerCase().includes(search.toLowerCase().trim())
  );

  const toggleSociety = (soc) => {
    if (selected.includes(soc)) {
      onChange(selected.filter(item => item !== soc));
    } else {
      onChange([...selected, soc]);
    }
  };

  const handleSelectAll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const allFiltered = Array.from(new Set([...selected, ...filteredSocieties]));
    onChange(allFiltered);
  };

  const handleClearAll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange([]);
  };

  const handleRemoveOne = (e, soc) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(selected.filter(item => item !== soc));
  };

  return (
    <div className="society-multiselect-container" ref={containerRef}>
      {/* Trigger Box */}
      <div
        className={`society-multiselect-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="society-chips-wrapper">
          {selected.length === 0 ? (
            <span className="society-placeholder">{placeholder}</span>
          ) : (
            selected.map((soc) => (
              <span key={soc} className="society-chip">
                <span>{soc}</span>
                <button
                  type="button"
                  className="society-chip-remove"
                  onClick={(e) => handleRemoveOne(e, soc)}
                  title={`Remove ${soc}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))
          )}
        </div>
        <div className={`society-multiselect-arrow ${isOpen ? 'open' : ''}`}>
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="society-dropdown-menu">
          {/* Search Bar */}
          <div className="society-search-box">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                className="society-search-input"
                style={{ paddingLeft: '30px' }}
                placeholder="Search societies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  onClick={() => setSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="society-dropdown-toolbar">
            <div>
              <button type="button" className="society-toolbar-btn" onClick={handleSelectAll}>
                Select All
              </button>
              <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span>
              <button type="button" className="society-toolbar-btn" onClick={handleClearAll}>
                Clear
              </button>
            </div>
            <span style={{ color: '#64748b', fontWeight: 600 }}>
              {selected.length} of {societies.length} selected
            </span>
          </div>

          {/* Societies List */}
          <div className="society-dropdown-list" role="listbox">
            {filteredSocieties.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                No matching societies found
              </div>
            ) : (
              filteredSocieties.map((soc) => {
                const isChecked = selected.includes(soc);
                return (
                  <div
                    key={soc}
                    className={`society-dropdown-item ${isChecked ? 'selected' : ''}`}
                    onClick={() => toggleSociety(soc)}
                    role="option"
                    aria-selected={isChecked}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by row click
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span style={{ flex: 1 }}>{soc}</span>
                    {isChecked && <Check size={14} color="#0b5299" strokeWidth={2.5} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocietyMultiSelect;
