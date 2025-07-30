import { useState } from "react";
import { supabase } from "~/lib/supabase";
import { FaUser, FaEnvelope, FaPhone } from "react-icons/fa";
import type { ManageEventsTabProps, Event, User } from "~/types";

interface SignedUpUser {
  id: string;
  status: string | null;
  user_id: string | null;
  event_id: string | null;
  created_at: string | null;
  user: User | null;
}

interface HoursUser {
  id: string;
  full_name: string;
  email: string;
}

const ManageEventsTab = ({ events, startEditEvent, deleteEvent }: ManageEventsTabProps) => {
  const [showModal, setShowModal] = useState(false);
  const [signedUpUsers, setSignedUpUsers] = useState<SignedUpUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Helper to check if event is in the past
  const isEventPast = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return false;
    const eventDate = new Date(dateStr + (timeStr ? "T" + timeStr : "T23:59"));
    return eventDate < new Date();
  };

  // Volunteer Hours Modal State
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [hoursEvent, setHoursEvent] = useState<Event | null>(null);
  const [hoursData, setHoursData] = useState<{ [userId: string]: number }>({});
  const [hoursUsers, setHoursUsers] = useState<HoursUser[]>([]);
  const [savingHours, setSavingHours] = useState(false);

  const formatDate = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return "No date";
    const date = new Date(dateStr + (timeStr ? "T" + timeStr : ""));
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      deleteEvent(id);
    }
  };

  const [cleaningImages, setCleaningImages] = useState(false);
  const [cleaningWaivers, setCleaningWaivers] = useState(false);

  const clearOldEventImages = async () => {
    if (!window.confirm("Clean up expired event images?")) return;
    setCleaningImages(true);

    try {
      // used to use supabase.rpc("cleanup_expired_event_images_rpc");
      const { error } = await supabase.functions.invoke("delete-past-event-images");

      if (error) {
        alert("Failed to clean up images: " + error.message);
      } else {
        alert("Successfully cleaned up expired event images!");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert("Failed to clean up images: " + errorMessage);
    } finally {
      setCleaningImages(false);
    }
  };

  const clearOldEventWaivers = async () => {
    if (!window.confirm("Clean up old waivers?")) return;
    setCleaningWaivers(true);

    try {
      const { error } = await supabase.functions.invoke("delete-past-event-waivers");

      if (error) {
        alert("Failed to clean up waivers: " + error.message);
      } else {
        alert("Successfully cleaned up old waivers!");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert("Failed to clean up waivers: " + errorMessage);
    } finally {
      setCleaningWaivers(false);
    }
  };

  const fetchSignedUpUsers = async (eventId: string) => {
    setLoadingUsers(true);
    setSignedUpUsers([]);
    setShowModal(true);

    try {
      const { data, error } = await supabase
        .from("event_signups")
        .select(
          `
          id,
          status,
          user_id,
          event_id,
          created_at,
          user:users (
            id,
            full_name,
            email,
            phone,
            role,
            status
          )
        `,
        )
        .eq("event_id", eventId);

      if (error) throw error;
      setSignedUpUsers((data as SignedUpUser[]) || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert("Failed to load signed up users: " + errorMessage);
    } finally {
      setLoadingUsers(false);
    }
  };

  const removeSignup = async (signupId: string) => {
    if (!window.confirm("Remove this user from the event?")) return;
    const { error } = await supabase.from("event_signups").delete().eq("id", signupId);
    if (error) return alert(error.message);
    setSignedUpUsers((prev) => prev.filter((su) => su.id !== signupId));
  };

  const copyField = (field: "email" | "phone") => {
    const text = signedUpUsers
      .map((s) => s.user?.[field])
      .filter(Boolean)
      .join(", ");
    navigator.clipboard.writeText(text);
    alert(`${field === "email" ? "Emails" : "Phone numbers"} copied!`);
  };

  // Open modal and fetch users for event
  const handleAddVolunteerHours = async (event: Event) => {
    setHoursEvent(event);
    setShowHoursModal(true);
    setSavingHours(false);
    setHoursData({});
    // Fetch users signed up for this event
    const { data } = await supabase
      .from("event_signups")
      .select("id, user_id, user:users(id, full_name, email)")
      .eq("event_id", event.id);
    setHoursUsers(
      data
        ?.map((s: { user: HoursUser | null }) => s.user)
        .filter((user): user is HoursUser => user !== null) || [],
    );
  };

  // Handle input change
  const handleHoursChange = (userId: string, value: string) => {
    setHoursData((prev) => ({ ...prev, [userId]: Number(value) }));
  };

  // Set all hours at once
  const handleSetAllHours = (value: string) => {
    const num = Number(value);
    if (isNaN(num)) return;
    const newData: { [userId: string]: number } = {};
    hoursUsers.forEach((user) => {
      newData[user.id] = num;
    });
    setHoursData(newData);
  };

  // Save volunteer hours to Supabase
  const handleSaveVolunteerHours = async () => {
    if (!hoursEvent) return;

    setSavingHours(true);
    try {
      const inserts = Object.entries(hoursData)
        .filter(([, hours]) => hours > 0)
        .map(([userId, hours]) => ({
          event_id: hoursEvent.id,
          user_id: userId,
          hours,
        }));
      if (inserts.length === 0) {
        alert("Please enter hours for at least one user.");
        setSavingHours(false);
        return;
      }
      // Insert or upsert volunteer hours
      const { error } = await supabase
        .from("volunteer_hours")
        .upsert(inserts, { onConflict: "event_id,user_id" });
      if (error) throw error;
      setShowHoursModal(false);
      alert("Volunteer hours saved!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      alert("Error saving hours: " + errorMessage);
    } finally {
      setSavingHours(false);
    }
  };

  return (
    <>
      <section className="space-y-4 max-w-4xl mx-auto">
        {events.length === 0 ? (
          <p className="text-gray-600 italic text-center">
            No events created yet. Use the <strong>Create Event</strong> tab to add new events.
          </p>
        ) : (
          events.map((event: Event) => (
            <div
              key={event.id}
              className="p-4 bg-white border rounded-lg shadow flex flex-col sm:flex-row sm:justify-between sm:items-center"
            >
              <div className="mb-2 sm:mb-0">
                <div className="font-semibold">{event.title}</div>
                <div className="text-sm text-gray-600">
                  <p>{formatDate(event.date, event.time || undefined)}</p>
                  <p>{event.location}</p>
                  {event.waiver_required && (
                    <p className="text-red-600 font-semibold">Waiver Required</p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => startEditEvent(event)}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-full text-white font-semibold"
                  aria-label={`Edit event ${event.title}`}
                  title={`Edit event ${event.title}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(event.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full text-white font-semibold"
                  aria-label={`Delete event ${event.title}`}
                  title={`Delete event ${event.title}`}
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => fetchSignedUpUsers(event.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-semibold"
                  aria-label={`View users signed up for ${event.title}`}
                  title={`View users signed up for ${event.title}`}
                >
                  View Users
                </button>
                {isEventPast(event.date, event.time || undefined) && (
                  <button
                    type="button"
                    onClick={() => handleAddVolunteerHours(event)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-full text-white font-semibold"
                    aria-label={`Add volunteer hours for ${event.title}`}
                    title={`Add volunteer hours for ${event.title}`}
                  >
                    Add Volunteer Hours
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#cdd1bc] p-8">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-6 text-2xl text-gray-600 hover:text-black font-bold"
              aria-label="Close modal"
              title="Close modal"
            >
              ×
            </button>

            <h2 className="text-3xl font-bold text-[#49682d] mb-4">Users Signed Up</h2>

            {!loadingUsers && signedUpUsers.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => copyField("email")}
                  className="bg-[#70923e] hover:bg-[#5c7c32] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2"
                  aria-label="Copy all user emails to clipboard"
                  title="Copy all user emails to clipboard"
                >
                  <FaEnvelope /> Copy Emails
                </button>
                <button
                  type="button"
                  onClick={() => copyField("phone")}
                  className="bg-[#70923e] hover:bg-[#5c7c32] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2"
                  aria-label="Copy all user phone numbers to clipboard"
                  title="Copy all user phone numbers to clipboard"
                >
                  <FaPhone /> Copy Phones
                </button>
              </div>
            )}

            {loadingUsers ? (
              <p className="text-gray-500 text-center">Loading users...</p>
            ) : signedUpUsers.length === 0 ? (
              <p className="text-gray-600 text-center italic">No users signed up yet.</p>
            ) : (
              <ul className="space-y-6">
                {signedUpUsers.map((signup) => {
                  const user = signup.user;
                  if (!user) return null;
                  return (
                    <li
                      key={signup.id}
                      className="p-4 rounded-2xl bg-[#f8f9f4] border border-[#dfe4cb] shadow-md"
                    >
                      <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="flex items-center gap-2 text-lg font-bold text-[#4d5a30]">
                            <FaUser className="text-[#6f7c45]" /> {user.full_name}
                          </p>
                          <p className="flex items-center gap-2 text-sm text-[#73814f] mt-1">
                            <FaEnvelope className="text-[#b2b998]" /> {user.email}
                          </p>
                          <p className="flex items-center gap-2 text-sm text-[#73814f]">
                            <FaPhone className="text-[#b2b998]" /> {user.phone}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {user.role} — {user.status}
                          </p>
                          <p className="text-xs text-gray-400">
                            Signed up on {formatDate(signup.created_at || "")}
                          </p>
                        </div>

                        <div className="mt-4 sm:mt-0 flex flex-col gap-2 items-start sm:items-end">
                          <button
                            type="button"
                            onClick={() => removeSignup(signup.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 text-sm rounded-full font-semibold"
                            aria-label={`Remove ${user.full_name} from event`}
                            title={`Remove ${user.full_name} from event`}
                          >
                            Remove User
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
      <div className="w-full flex flex-col items-center gap-4 mt-4">
        <button
          onClick={clearOldEventImages}
          disabled={cleaningImages}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-full text-white font-semibold"
          aria-label="Clean up old event images"
          title="Clean up old event images"
        >
          {cleaningImages ? "Cleaning..." : "Delete Old Images"}
        </button>
        <button
          onClick={clearOldEventWaivers}
          disabled={cleaningWaivers}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-full text-white font-semibold"
          aria-label="Clean up old event waivers"
          title="Clean up old event waivers"
        >
          {cleaningWaivers ? "Cleaning..." : "Delete Old Waivers"}
        </button>
      </div>

      {/* Volunteer Hours Modal */}
      {showHoursModal && hoursEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#cdd1bc] p-8">
            <button
              type="button"
              onClick={() => setShowHoursModal(false)}
              className="absolute top-4 right-6 text-2xl text-gray-600 hover:text-black font-bold"
              aria-label="Close volunteer hours modal"
              title="Close volunteer hours modal"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-[#49682d] mb-4">
              Add Volunteer Hours for {hoursEvent.title}
            </h2>
            {hoursUsers.length === 0 ? (
              <p className="text-gray-600 italic">No approved users for this event.</p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveVolunteerHours();
                }}
              >
                <div className="mb-6 flex items-center gap-4">
                  <label htmlFor="all-hours" className="font-semibold">
                    Set hours for all attendees:
                  </label>
                  <input
                    id="all-hours"
                    type="number"
                    min="0"
                    step="0.5"
                    className="border rounded px-2 py-1 w-24"
                    placeholder="Hours"
                    onChange={(e) => handleSetAllHours(e.target.value)}
                    aria-label="Set hours for all attendees"
                    title="Set the same number of hours for all attendees"
                  />
                  <span className="text-gray-500 text-sm">hours</span>
                </div>
                <div className="space-y-4 mb-6">
                  {hoursUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-4">
                      <label htmlFor={`hours-${user.id}`} className="w-40 font-semibold">
                        {user.full_name}
                      </label>
                      <input
                        id={`hours-${user.id}`}
                        type="number"
                        min="0"
                        step="0.5"
                        className="border rounded px-2 py-1 w-24"
                        placeholder="Hours"
                        value={hoursData[user.id] || ""}
                        onChange={(e) => handleHoursChange(user.id, e.target.value)}
                        required
                        aria-label={`Hours for ${user.full_name}`}
                        title={`Enter volunteer hours for ${user.full_name}`}
                      />
                      <span className="text-gray-500 text-sm">hours</span>
                    </div>
                  ))}
                </div>
                <button
                  type="submit"
                  className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-full font-semibold"
                  disabled={savingHours}
                  aria-label="Save volunteer hours"
                  title="Save volunteer hours for all users"
                >
                  {savingHours ? "Saving..." : "Save Hours"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ManageEventsTab;
