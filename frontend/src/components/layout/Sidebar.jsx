import React from "react";
import { Video, Home, Calendar, Users, Settings } from "lucide-react";

/**
 * A highly responsive, premium sidebar styled to mimic Zoom.
 * Fits perfectly on desktop (fixed left), tablet (compact), and mobile (horizontal bottom layout).
 * 
 * @param {object} props
 * @param {string} [props.activeTab="home"] - The currently active tab name.
 * @param {function} [props.onTabChange] - Optional callback when tabs are clicked.
 */
export default function Sidebar({ activeTab = "home", onTabChange }) {
  const menuItems = [
    { id: "home", label: "Home", icon: Home, isPlaceholder: false },
    { id: "meetings", label: "Meetings", icon: Calendar, isPlaceholder: true },
    { id: "contacts", label: "Contacts", icon: Users, isPlaceholder: true },
    { id: "settings", label: "Settings", icon: Settings, isPlaceholder: true },
  ];

  const handleTabClick = (item) => {
    if (item.isPlaceholder) {
      // For Phase 2, placeholders shouldn't lead to broken routes,
      // so we can show a nice browser alert/notification or ignore it gracefully.
      return;
    }
    if (onTabChange) {
      onTabChange(item.id);
    }
  };

  return (
    <aside 
      className="bg-[#1A1F2C] text-white flex flex-col md:w-64 sm:w-20 w-full md:h-screen sm:h-screen h-16 fixed md:top-0 sm:top-0 bottom-0 left-0 z-40 border-r border-[#2C3444] transition-all duration-300" 
      id="app-sidebar"
    >
      {/* Sidebar Header / Logo (hidden on mobile, compact on tablet, full on desktop) */}
      <div className="hidden sm:flex items-center gap-3 p-6 border-b border-[#2C3444]" id="sidebar-logo-container">
        <div className="bg-[#2D8CFF] p-2 rounded-xl text-white shadow-md flex items-center justify-center flex-shrink-0" id="sidebar-logo">
          <Video className="w-5 h-5 fill-white stroke-[1.5]" />
        </div>
        <span className="font-bold text-lg leading-none tracking-tight hidden md:inline-block" id="sidebar-brand-name">
          Zoom<span className="text-[#2D8CFF] font-medium text-sm ml-0.5">Clone</span>
        </span>
      </div>

      {/* Navigation List (vertical on desktop/tablet, horizontal on mobile) */}
      <nav 
        className="flex flex-row sm:flex-col justify-around sm:justify-start flex-1 sm:p-4 p-2 sm:space-y-1.5 w-full" 
        id="sidebar-navigation"
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item)}
              disabled={false}
              className={`
                flex flex-col sm:flex-row items-center gap-1 sm:gap-3.5 px-3 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 group relative w-full justify-center sm:justify-start
                ${isActive 
                  ? "bg-[#2D8CFF] text-white shadow-sm" 
                  : "text-gray-400 hover:bg-[#252C3A] hover:text-white"
                }
                ${item.isPlaceholder ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
              `}
              id={`sidebar-item-${item.id}`}
              title={item.isPlaceholder ? `${item.label} (Coming Soon)` : item.label}
            >
              {/* Icon */}
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
              
              {/* Text Label - Responsive */}
              <span className="hidden md:inline-block font-medium tracking-wide">
                {item.label}
              </span>
              <span className="sm:hidden block mt-0.5 text-[10px] scale-90 font-normal">
                {item.label}
              </span>

              {/* Tooltip for Tablet/Icon-Only View */}
              <span className="hidden sm:group-hover:inline-block md:hidden absolute left-20 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-md shadow-md font-normal whitespace-nowrap z-50 border border-gray-800">
                {item.label} {item.isPlaceholder && " (Soon)"}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer - desktop user metadata placeholder */}
      <div className="hidden md:block p-4 border-t border-[#2C3444] bg-[#141822]" id="sidebar-footer">
        <div className="flex items-center gap-3">
          <div className="bg-[#2D8CFF]/10 text-[#2D8CFF] text-xs font-semibold py-1 px-2.5 rounded-full uppercase tracking-wider">
            Enterprise
          </div>
          <span className="text-[10px] text-gray-500 font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
