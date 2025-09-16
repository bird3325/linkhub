import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelId?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'purple';
}

const Toggle: React.FC<ToggleProps> = ({ 
  checked, 
  onChange, 
  labelId, 
  disabled = false,
  size = 'md',
  color = 'blue'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-8'
  };

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0',
    md: checked ? 'translate-x-5' : 'translate-x-0',
    lg: checked ? 'translate-x-6' : 'translate-x-0'
  };

  const colorClasses = {
    blue: checked ? 'bg-blue-600' : 'bg-gray-200',
    green: checked ? 'bg-green-600' : 'bg-gray-200',
    red: checked ? 'bg-red-600' : 'bg-gray-200',
    purple: checked ? 'bg-purple-600' : 'bg-gray-200'
  };

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      onClick={handleClick}
      onKeyDown={handleKeyPress}
      disabled={disabled}
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]}
        relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 
        focus:ring-blue-500
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-75'}
      `}
    >
      <span className="sr-only">토글 스위치</span>
      <span
        aria-hidden="true"
        className={`
          ${thumbSizeClasses[size]} 
          ${translateClasses[size]}
          pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 
          transition duration-200 ease-in-out
          ${disabled ? '' : 'hover:scale-105'}
        `}
      />
    </button>
  );
};

export default Toggle;
