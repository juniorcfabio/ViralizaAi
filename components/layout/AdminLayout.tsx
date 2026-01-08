



import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
// FIX: Changed from named import to default import since AdminSidebar is the default export.
import AdminSidebar from '../ui/AdminSidebar';

const AdminLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-primary text-light">
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-secondary p-3 rounded-lg border border-gray-600 text-white hover:bg-gray-700 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out`}>
                <AdminSidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
                <div className="flex-1 overflow-y-auto">
                    <main className="p-4 sm:p-6 lg:p-10 min-h-full pt-16 lg:pt-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
