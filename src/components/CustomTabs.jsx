import React from 'react';

const CustomTabs = ({ tabs, activeTab, onChange, className = "" }) => {
  return (
    <div className={`flex items-center bg-white border border-slate-200 rounded-full p-1 shadow-sm w-max overflow-x-auto hide-scrollbar ${className}`}>
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <React.Fragment key={tab.id}>
            <button
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 outline-none
                ${isActive 
                  ? 'bg-blue-50 text-brand-blue' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }
              `}
            >
              {Icon && <Icon size={16} className={isActive ? 'text-brand-blue' : 'text-slate-400'} />}
              {tab.label}
            </button>
            
            {/* Divider */}
            {index < tabs.length - 1 && (
              <div className="w-[1px] h-5 bg-slate-200 mx-1"></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default CustomTabs;
