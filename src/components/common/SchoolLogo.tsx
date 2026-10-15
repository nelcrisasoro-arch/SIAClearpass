import React from 'react';
import schoolLogoUrl from '../../assets/images/sia_school_logo.jpg';

interface SchoolLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showName?: boolean;
}

const sizeClasses = { sm: 'h-9 w-9', md: 'h-16 w-16', lg: 'h-24 w-24' };

export const SchoolLogo: React.FC<SchoolLogoProps> = ({ size = 'md', className = '', showName = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} shrink-0 overflow-hidden rounded-full border-2 border-blue-900 bg-white p-1 shadow-md`}>
        <img
          src={schoolLogoUrl}
          alt="St. Isidore Academy of Trinidad Bohol school logo"
          className="h-full w-full rounded-full object-cover"
          onError={(event) => { event.currentTarget.style.display = 'none'; }}
        />
      </div>
      {showName && (
        <div>
          <div className="font-bold tracking-tight text-white">SIA ClearPass</div>
          <div className="text-[10px] text-slate-400">St. Isidore Academy of Trinidad Bohol, Inc.</div>
        </div>
      )}
    </div>
  );
};
