import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "~/context/auth/AuthContext";
import { supabase } from "~/lib/supabase";

export const useAuthRedirect = () => {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const protectedRoutes = ["/dashboard", "/admin"];
    const { pathname } = location;

    if (!protectedRoutes.includes(pathname)) return;

    // If auth is still loading, don't redirect yet
    if (loading) return;

    (async () => {
      if (!user) {
        return pathname !== "/not-allowed" && navigate("/not-allowed");
      }

      // Fetch user's status and role from DB
      const { data: userRecord, error } = await fetchUserDetails(user.id);
      if (error || !userRecord) {
        console.error("User lookup failed:", error?.message);
        return pathname !== "/not-allowed" && navigate("/not-allowed");
      }

      // Check if user is approved
      if (userRecord.status !== "APPROVED") {
        return pathname !== "/not-approved" && navigate("/not-approved");
      }

      // Check admin access for /admin route
      if (pathname === "/admin" && userRecord.role !== "ADMIN") {
        return navigate("/not-allowed");
      }

      // If user is approved and on not-approved page, redirect to dashboard
      if (pathname === "/not-approved") {
        navigate("/dashboard");
      }
    })();
  }, [user, session, loading, location, location.pathname, navigate]);
};

// Helper to fetch user details
async function fetchUserDetails(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("status, role")
    .eq("id", userId)
    .single();

  return { data, error };
}
