import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "~/lib/supabaseClient";
import clsx from "clsx";
import PendingUsersTab from "~/components/admin/PendingUsersTab";
import AllUsersTab from "~/components/admin/AllUsersTab";
import CreateEventTab from "~/components/admin/CreateEventTab";
import ManageEventsTab from "~/components/admin/ManageEventsTab";
import WebsiteDetailsTab from "~/components/admin/WebsiteDetailsTab";
import { useDeletePastEventPDFs } from "~/hooks/useDeletePastEventPDFs";
import { useDeletePastEventImages } from "~/hooks/useDeletePastEventImages";
import type { User, Event, EventFormData } from "~/types";
import { useAuth } from "../context/auth/AuthContext";

const tabs = ["Pending Users", "All Users", "Create Event", "Manage Events", "Website Details"];

const roles = ["ALL", "STUDENT", "PARENT", "ADMIN", "OTHER"]; // adjust based on your roles
const statusOptions = ["ALL", "APPROVED", "PENDING", "REJECTED"];

const AdminPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("Pending Users");
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [pendingRoleFilter, setPendingRoleFilter] = useState("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");
  const [pendingStatusFilter, setPendingStatusFilter] = useState("ALL");
  const [eventForm, setEventForm] = useState<EventFormData>({
    id: "", // for editing events
    title: "",
    description: "",
    date: "",
    time: "", // new time field
    location: "",
    waiver_required: false,
    waiver_url: "",
  });

  const navigate = useNavigate();

  // Helper to format ISO datetime string to YYYY-MM-DD for input type=date
  const formatDateForInput = (isoDateStr: string) => {
    if (!isoDateStr) return "";
    return isoDateStr.split("T")[0];
  };

  // Fetch all necessary data
  const fetchData = useCallback(async () => {
    // Wait for auth to be ready
    if (authLoading) return;

    // If no user, let the AuthRedirect handle navigation
    if (!user) return;

    const { data: currentUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!currentUser || currentUser.role !== "ADMIN" || currentUser.status !== "APPROVED") {
      return navigate("/not-allowed");
    }

    const [eventsResp, { data: usersResp }] = await Promise.all([
      supabase.from("events").select("*").order("date", { ascending: true }),
      supabase.from("users").select("*").order("full_name", { ascending: true }),
    ]);

    // Split users into pending and all users
    const allUsers = usersResp || [];
    const pendingResp = allUsers.filter(
      (u) => u.status === "PENDING" && u.email_confirmed === true,
    );

    setPendingUsers(pendingResp || []);
    setEvents(eventsResp.data || []);
    setAllUsers(usersResp || []);
    setLoading(false);
  }, [authLoading, user, navigate]);

  useEffect(() => {
    fetchData();
  }, [user, authLoading, fetchData]);

  // User approval/reject
  const updateUserStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    const { error } = await supabase.from("users").update({ status }).eq("id", id);
    if (error) return alert(`Error updating user: ${error.message}`);

    setPendingUsers((prev) => prev.filter((u) => u.id !== id));
    setAllUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  };

  // Toggle user detail expand
  const toggleExpand = (id: string) => {
    setExpandedUserId((prev) => (prev === id ? null : id));
  };

  // Filter users based on role and status
  const filterUsers = (users: User[], roleFilter: string, statusFilter: string) => {
    let filtered = users;
    if (roleFilter !== "ALL") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }
    return filtered;
  };

  // Event form input handler (supports edit/create)
  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setEventForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Create or update event
  // Prevent editing a past event to a future date
  const saveEvent = async (e: React.FormEvent, waiverFile?: File) => {
    e.preventDefault();
    const eventId = eventForm.id ? String(eventForm.id) : "";
    const formattedDate = eventForm.date ? eventForm.date.split("T")[0] : "";
    let waiver_url = eventForm.waiver_url || "";
    const now = new Date().toISOString().split("T")[0];
    if (eventId) {
      // Editing an existing event
      const originalEvent = events.find((ev) => String(ev.id) === eventId);
      if (originalEvent && originalEvent.date < now && formattedDate >= now) {
        alert("You cannot change a past event to a future date.");
        return;
      }
    }
    if (eventForm.waiver_required && !waiverFile && !waiver_url) {
      alert("You must upload a waiver PDF for this event.");
      return;
    }
    if (eventForm.waiver_required && waiverFile) {
      // Upload to Supabase Storage
      const fileName = `${Date.now()}_${waiverFile.name}`;
      const { error } = await supabase.storage
        .from("waivers")
        .upload(fileName, waiverFile, { upsert: true });
      if (error) return alert("Failed to upload waiver PDF: " + error.message);
      const { data: publicUrlData } = supabase.storage.from("waivers").getPublicUrl(fileName);
      waiver_url = publicUrlData.publicUrl;
    }
    const eventData = {
      title: eventForm.title,
      description: eventForm.description,
      date: formattedDate,
      time: eventForm.time,
      location: eventForm.location,
      waiver_required: eventForm.waiver_required,
      waiver_url: eventForm.waiver_required ? waiver_url : "",
    };
    if (eventId) {
      const { data, error } = await supabase
        .from("events")
        .update(eventData)
        .eq("id", eventId)
        .select("*");
      if (error) return alert(error.message);
      if (!data || data.length === 0)
        alert("No event was updated. Check if the event ID matches the database.");
    } else {
      const { error } = await supabase.from("events").insert(eventData);
      if (error) return alert(error.message);
    }
    setEventForm({
      id: "",
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      waiver_required: false,
      waiver_url: "",
    });
    await fetchData();
    setActiveTab("Manage Events");
  };

  // Delete event
  const deleteEvent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return alert(error.message);
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  // Populate event form for editing, with fixed date formatting
  const startEditEvent = (event: Event) => {
    setEventForm({
      id: event.id,
      title: event.title,
      description: event.description,
      date: formatDateForInput(event.date),
      time: event.time || "",
      location: event.location,
      waiver_required: event.waiver_required,
      waiver_url: event.waiver_url || "",
    });
    setActiveTab("Create Event");
  };

  // Copy bulk data to clipboard helpers
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  // Generate bulk email or phone list based on filters
  const generateBulkList = (field: "email" | "phone") => {
    const filtered = filterUsers(allUsers, userRoleFilter, userStatusFilter);
    const list = filtered
      .map((u) => u[field])
      .filter(Boolean)
      .join(", ");

    return list;
  };

  // --- Automated deletion of PDFs for past events ---
  const deletePastEventPDFs = useDeletePastEventPDFs(
    "waivers",
    async () =>
      (events || []).filter((ev) => {
        // Only events with a waiver_url and a date in the past
        return ev.waiver_required && ev.waiver_url && new Date(ev.date) < new Date();
      }),
    (event) => {
      try {
        // Supabase public URL: .../storage/v1/object/public/waivers/<file>
        // We want the path relative to the bucket, e.g. '<file>'
        if (!event.waiver_url) return "";
        const url = new URL(event.waiver_url);
        const match = url.pathname.match(/waivers\/(.+)$/);
        if (match && match[1]) {
          return match[1];
        }
      } catch (e) {
        console.error("Failed to parse waiver_url:", event.waiver_url, e);
      }
      return "";
    },
  );

  const deletePastEventImages = useDeletePastEventImages(
    "events",
    () => events || [],
    (event) => (event.image_id ? `images/${event.image_id}` : null),
  );

  useEffect(() => {
    if (events.length > 0) {
      deletePastEventPDFs().then(() => {
        // Optionally, you can refresh events here if needed
      });
      deletePastEventImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  if (loading) return <div className="text-center py-20 text-lg">Loading admin panel...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-10 mt-24">
      <h1 className="text-4xl font-bold text-[#8a9663] text-center mb-6">Admin Panel</h1>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={clsx(
              "px-4 py-2 rounded-full font-semibold transition whitespace-nowrap",
              activeTab === tab
                ? "bg-[#8a9663] text-white shadow-lg"
                : "bg-[#dfe5cd] text-[#4d5640] hover:bg-[#cbd6b0]",
            )}
            onClick={() => setActiveTab(tab)}
            aria-label={`Switch to ${tab} tab`}
            title={`Switch to ${tab} tab`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "Pending Users" && (
          <PendingUsersTab
            pendingUsers={pendingUsers}
            pendingRoleFilter={pendingRoleFilter}
            setPendingRoleFilter={setPendingRoleFilter}
            pendingStatusFilter={pendingStatusFilter}
            setPendingStatusFilter={setPendingStatusFilter}
            roles={roles}
            statusOptions={statusOptions}
            filterUsers={filterUsers}
            expandedUserId={expandedUserId}
            toggleExpand={toggleExpand}
            updateUserStatus={updateUserStatus}
          />
        )}
        {activeTab === "All Users" && (
          <AllUsersTab
            allUsers={allUsers}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            userStatusFilter={userStatusFilter}
            setUserStatusFilter={setUserStatusFilter}
            roles={roles}
            statusOptions={statusOptions}
            filterUsers={filterUsers}
            expandedUserId={expandedUserId}
            toggleExpand={toggleExpand}
            copyToClipboard={copyToClipboard}
            generateBulkList={generateBulkList}
          />
        )}
        {activeTab === "Create Event" && (
          <CreateEventTab
            eventForm={eventForm}
            handleEventChange={handleEventChange}
            saveEvent={saveEvent}
            setEventForm={setEventForm}
          />
        )}
        {activeTab === "Manage Events" && (
          <ManageEventsTab
            events={events}
            startEditEvent={startEditEvent}
            deleteEvent={deleteEvent}
          />
        )}
        {activeTab === "Website Details" && <WebsiteDetailsTab />}
      </div>
    </div>
  );
};

export default AdminPanel;
