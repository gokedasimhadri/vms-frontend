import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Modern Animated Table Loader
 * Renders inside a table row spanning all columns with a clean, smooth animation
 */
export const TableLoader = ({ colSpan = 10, message = 'Loading records, please wait...', subMessage = 'Fetching data from server...' }) => {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0, border: 'none' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            minHeight: '220px'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '48px',
              height: '48px',
              marginBottom: '16px'
            }}
          >
            {/* Soft pulsing background glow */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundColor: 'rgba(11, 82, 153, 0.12)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            />
            {/* Spinning icon */}
            <Loader2
              style={{
                width: '48px',
                height: '48px',
                color: '#0b5299',
                animation: 'spin 1s linear infinite'
              }}
            />
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '4px',
              letterSpacing: '0.2px'
            }}
          >
            {message}
          </div>
          {subMessage && (
            <div
              style={{
                fontSize: '12px',
                color: '#64748b'
              }}
            >
              {subMessage}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

/**
 * Modern Full Container / Card Page Loader
 */
export const PageLoader = ({ message = 'Loading, please wait...', subMessage = 'Fetching data from server...', minHeight = '300px' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        minHeight,
        width: '100%'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '48px',
          height: '48px',
          marginBottom: '16px'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            backgroundColor: 'rgba(11, 82, 153, 0.12)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />
        <Loader2
          style={{
            width: '48px',
            height: '48px',
            color: '#0b5299',
            animation: 'spin 1s linear infinite'
          }}
        />
      </div>
      <div
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: '#1e293b',
          marginBottom: '4px',
          letterSpacing: '0.2px'
        }}
      >
        {message}
      </div>
      {subMessage && (
        <div
          style={{
            fontSize: '12px',
            color: '#64748b'
          }}
        >
          {subMessage}
        </div>
      )}
    </div>
  );
};

export default PageLoader;
