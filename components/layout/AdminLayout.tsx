



import React from 'react';
import { Outlet } from 'react-router-dom';
// FIX: Changed from named import to default import since AdminSidebar is the default export.
import AdminSidebar from '../ui/AdminSidebar';

const AdminLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-primary text-light">
            <AdminSidebar />
            <div className="flex-1 overflow-y-auto">
                <main className="p-6 lg:p-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
