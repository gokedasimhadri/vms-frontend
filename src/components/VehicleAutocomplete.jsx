import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { searchVehicleInfo } from '../services/api';

/**
 * VehicleAutocomplete
 * Real-time auto-populating dropdown list for vehicle registration numbers
 * querying the vehicleinfo collection.
 */
const VehicleAutocomplete = ({
  value = '',
  onChange,
  onSelectVehicle,
  placeholder = 'Enter Registration No...',
  required = false
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const ignoreNextSearchRef = useRef(false);

  // Synchronize when value changes from parent (e.g. modal open / edit reset)
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Dismiss dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch matching vehicles when user types or focuses
  const fetchVehicles = async (searchTerm) => {
    setLoading(true);
    try {
      const res = await searchVehicleInfo(searchTerm || '');
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setSuggestions(list);
      setIsOpen(list.length > 0);
      setHighlightedIndex(-1);
    } catch (err) {
      console.error('Failed searching vehicles:', err);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ignoreNextSearchRef.current) {
      ignoreNextSearchRef.current = false;
      return;
    }

    const trimmed = (query || '').trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchVehicles(trimmed);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (vehicle) => {
    const regno = vehicle.regno || vehicle;
    ignoreNextSearchRef.current = true;
    setQuery(regno);
    onChange(regno);
    if (onSelectVehicle) {
      onSelectVehicle(vehicle);
    }
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="vehicle-autocomplete-container" ref={containerRef}>
      <div className="vehicle-autocomplete-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            onChange(val);
          }}
          onFocus={() => {
            if ((query || '').trim() && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="admin-form-input vehicle-autocomplete-input"
          autoComplete="off"
        />
        {loading && (
          <div className="vehicle-autocomplete-spinner">
            <Loader2 size={15} className="btn-spinner" color="#0b5299" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="vehicle-autocomplete-dropdown" role="listbox">
          {suggestions.map((item, idx) => {
            const regno = item.regno || item;
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={item._id || regno || idx}
                className={`vehicle-autocomplete-item ${isHighlighted ? 'highlighted' : ''}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                role="option"
                aria-selected={isHighlighted}
              >
                <span className="vehicle-regno-text">{regno}</span>
                {item.model && (
                  <span className="vehicle-model-badge">
                    {item.make ? `${item.make} - ${item.model}` : item.model}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default VehicleAutocomplete;
