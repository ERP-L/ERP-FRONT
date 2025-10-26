import React from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
//import { useAppStore } from "./store";
import AuthLayout from "../ui/layouts/AppLayout";
import PortalLayout from "../ui/layouts/PortalLayout";
import LoginPage from "../ui/pages/LoginPage";
import SignupCompanyPage from "../ui/pages/SignupCompanyPage";
import SignupAdminPage from "../ui/pages/SignupAdminPage";
import HomePage from "../ui/pages/HomePage";
import NotificationsPage from "../ui/pages/NotificationsPage";
import BranchCreatePage from "../ui/pages/BranchCreatePage";
import WarehouseCreatePage from "../ui/pages/WarehouseCreatePage";
import ProductCreatePage from "../ui/pages/ProductCreatePage";
import InventarioCreatePage from "../ui/pages/InventarioCreatePage";
import CategoryCreatePage from "../ui/pages/CategoryCreatePage";
import ProfilePage from "../ui/pages/ProfilePage";


function RequireAuth({ children }: { children: React.ReactNode }) {
//const { session } = useAppStore();
// TEMP: Deshabilitar protección mientras se navega libremente
// if (!session) return <Navigate to="/login" replace />;
return <>{children}</>;
}


const router = createBrowserRouter([
{
element: <AuthLayout />, children: [
{ path: "/", element: <Navigate to="/login" replace /> },
{ path: "/login", element: <LoginPage /> },
{ path: "/signup", element: <Navigate to="/signup/company" replace /> },
{ path: "/signup/company", element: <SignupCompanyPage /> },
{ path: "/signup/admin", element: <SignupAdminPage /> },
]
},
{
element: <RequireAuth><PortalLayout /></RequireAuth>,
    children: [
      { path: "/app", element: <Navigate to="/app/home" replace /> },
      { path: "/app/home", element: <HomePage /> },
      { path: "/app/notifications", element: <NotificationsPage /> },
      { path: "/app/branches", element: <BranchCreatePage /> },
      { path: "/app/warehouses", element: <WarehouseCreatePage /> },
      { path: "/app/products", element: <ProductCreatePage /> },
      { path: "/app/categories", element: <CategoryCreatePage /> },
      { path: "/app/inventory", element: <InventarioCreatePage /> },
      { path: "/app/profile", element: <ProfilePage /> },
    ]
}
]);


export default function AppRouter() {
return <RouterProvider router={router} />;
}