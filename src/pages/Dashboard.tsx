import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "~/lib/supabase";
import { useAuth } from "~/context/auth/AuthContext";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { fadeUp } from "~/constants/animations";
import Modal from "~/components/ui/Modal";
import type {
  User,
  EventSignup,
  VolunteerHoursWithEvent,
  GraphPeriod,
  ChartDataPoint,
  EventWithImageUrl,
} from "~/types";
import { Calendar, Clock, MapPin, FileText } from "lucide-react";

const staggerContainer = {
  show: { transition: { staggerChildren: 0.1 } },
  hidden: {},
};

const Dashboard = () => {
  const { user: authUser, signOut, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);
  const [events, setEvents] = useState<EventWithImageUrl[]>([]);
  const [userSignups, setUserSignups] = useState<Record<string, EventSignup>>({});
  const [signupLoading, setSignupLoading] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventWithImageUrl | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHoursWithEvent[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [graphPeriod, setGraphPeriod] = useState<GraphPeriod>("week");
  const [graphData, setGraphData] = useState<ChartDataPoint[]>([]);

  const navigate = useNavigate();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "No date";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleLogout = async () => {
    navigate("/");
    await signOut();
  };

  useEffect(() => {
    const fetchData = async () => {
      // Wait for auth to be ready
      if (authLoading) return;

      // If no user, let the AuthRedirect handle navigation
      if (!authUser) return;

      const { data: userInfo, error: userError } = await supabase
        .from("users")
        .select("status, full_name, role, id, email, phone, lead_id, email_confirmed")
        .eq("id", authUser.id)
        .single();

      if (userError || !userInfo) return navigate("/get-involved?login=true");
      if (userInfo.status !== "APPROVED") return navigate("/not-approved");
      setUserData(userInfo as User);

      // Get all files once to avoid repeated API calls
      try {
        // Get all events
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .order("date", { ascending: true });

        if (eventError) throw eventError;

        if (!eventData || eventData.length === 0) {
          setEvents([]);
          return;
        }

        // Get all images from storage
        const { data: allImages, error: imageError } = await supabase.storage
          .from("events")
          .list("images", { limit: 1000 });

        if (imageError) throw imageError;

        // Create image map for efficient lookup
        const imageMap = new Map(allImages.map((image) => [image.id, image]));

        // Merge events with their corresponding images
        const eventsWithImages = eventData.map((event) => {
          if (!event.image_id || !imageMap.has(event.image_id)) {
            return {
              ...event,
              image: null,
              imageUrl: null,
            };
          }

          const image = imageMap.get(event.image_id) || null;
          const {
            data: { publicUrl },
          } = supabase.storage.from("events/images").getPublicUrl(image!.name);

          return {
            ...event,
            image,
            imageUrl: publicUrl,
          };
        });

        // console.log("Events with images:", eventsWithImages);
        setEvents(eventsWithImages || []);
      } catch (error) {
        console.error("Error fetching events with images:", error);
        setEvents([]);
      }

      const { data: signups } = await supabase
        .from("event_signups")
        .select("*")
        .eq("user_id", authUser.id);

      const signupMap: Record<string, EventSignup> = {};
      (signups || []).forEach((su) => {
        if (su.event_id) {
          signupMap[su.event_id] = su;
        }
      });
      setUserSignups(signupMap);

      // Fetch volunteer hours
      const { data: hoursData } = await supabase
        .from("volunteer_hours")
        .select("id, user_id, event_id, hours, event:events!inner(id, title, date, time)")
        .eq("user_id", authUser.id);
      setVolunteerHours((hoursData || []) as unknown as VolunteerHoursWithEvent[]);
      setTotalHours((hoursData || []).reduce((sum, h) => sum + (h.hours || 0), 0));

      // Aggregate for graph
      if (hoursData) {
        setGraphData(aggregateHours(hoursData as unknown as VolunteerHoursWithEvent[], "month"));
      }

      setLoading(false);
    };
    fetchData();
  }, [authUser, authLoading, navigate]);

  // Update graph when period or data changes
  useEffect(() => {
    setGraphData(aggregateHours(volunteerHours, graphPeriod));
  }, [volunteerHours, graphPeriod]);

  // Helper to aggregate hours
  function aggregateHours(
    hoursArr: VolunteerHoursWithEvent[],
    period: GraphPeriod,
  ): ChartDataPoint[] {
    if (!hoursArr || hoursArr.length === 0) return [];
    const map: Record<string, number> = {};
    hoursArr.forEach((h) => {
      const date = h.event?.date;
      if (!date) return;
      const d = new Date(date);
      let key = "";
      if (period === "week") {
        // Week of year
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(
          ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
        );
        key = `${d.getFullYear()}-W${week}`;
      } else if (period === "month") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = `${d.getFullYear()}`;
      }
      map[key] = (map[key] || 0) + (h.hours || 0);
    });
    // Sort keys
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, hours]) => ({ name, hours }));
  }

  const handleSignUp = async (eventId: string) => {
    if (!authUser) return;
    setSignupLoading(eventId);
    await supabase.from("event_signups").insert({
      event_id: eventId,
      user_id: authUser.id,
      status: "SIGNED_UP",
    });
    const { data: signups } = await supabase
      .from("event_signups")
      .select("*")
      .eq("user_id", authUser.id);
    const signupMap: Record<string, EventSignup> = {};
    (signups || []).forEach((su) => {
      if (su.event_id) {
        signupMap[su.event_id] = su;
      }
    });
    setUserSignups(signupMap);
    setSignupLoading(null);
  };

  const handleCancelSignup = async (eventId: string) => {
    if (!authUser) return;
    if (!window.confirm("Cancel your signup for this event?")) return;
    setSignupLoading(eventId);
    await supabase.from("event_signups").delete().eq("id", userSignups[eventId].id);
    const { data: signups } = await supabase
      .from("event_signups")
      .select("*")
      .eq("user_id", authUser.id);
    const signupMap: Record<string, EventSignup> = {};
    (signups || []).forEach((su) => {
      if (su.event_id) {
        signupMap[su.event_id] = su;
      }
    });
    setUserSignups(signupMap);
    setSignupLoading(null);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingEvents = events.filter((ev) => ev.date >= todayStr);
  const pastEvents = events.filter((ev) => ev.date < todayStr);

  // Show loading while auth is being resolved
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8a9663] mx-auto mb-4"></div>
          <p className="text-[#6b7547] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="py-32 text-center text-xl text-[#6b7547] font-semibold">
        Loading dashboard...
      </div>
    );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="min-h-screen bg-gradient-to-br from-[#f4f3ec] via-[#ebe7d9] to-[#dba979] py-24 px-4 flex justify-center items-start relative overflow-hidden"
    >
      {/* Decorative Glow Effect */}
      <div className="absolute top-[-10%] right-[-20%] w-[600px] h-[600px] bg-[#8a9663]/10 rounded-full blur-[120px] opacity-40 z-0 animate-pulse hidden lg:block" />
      <div className="absolute bottom-[-15%] left-[-25%] w-[800px] h-[800px] bg-[#c27d50]/8 rounded-full blur-[140px] opacity-30 z-0 hidden lg:block" />

      {/* Admin Panel and Log Out Buttons (fixed, stacked, always spaced) */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
        {userData?.role === "ADMIN" && (
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="bg-[#8a9663] hover:bg-[#7a8757] text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 w-40 font-semibold hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#8a9663]/50"
            aria-label="Go to admin panel"
            title="Go to admin panel"
          >
            Admin Panel
          </button>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="bg-[#c27d50] hover:bg-[#a46336] text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 w-40 font-semibold hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c27d50]/50"
          aria-label="Log out of account"
          title="Log out of account"
        >
          Log Out
        </button>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 px-2">
        {/* LEFT SIDE */}
        <div className="space-y-10 w-full lg:w-1/2">
          <motion.div
            variants={fadeUp}
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-white via-[#f9f8f4] to-[#f4f3ec] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-[#cdd1bc] backdrop-blur-sm"
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#6b7547] mb-4 drop-shadow-sm">
              {`Hey ${userData?.full_name || "User"},`}
            </h1>
            <p className="text-base sm:text-lg text-[#c27d50] font-medium leading-relaxed">
              You're on a mission to save the 🌍 — or at least the local park. Here's your impact.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="bg-gradient-to-br from-white via-[#f9f8f4] to-[#f4f3ec] rounded-3xl p-8 shadow-2xl border border-[#cdd1bc] backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#6b7547] drop-shadow-sm">
                Hours Volunteered
              </h2>
              <div>
                <label htmlFor="graph-period-select" className="sr-only">
                  Select time period for volunteer hours graph
                </label>
                <select
                  id="graph-period-select"
                  className="border border-[#cdd1bc] rounded-lg px-3 py-2 text-[#6b7547] font-semibold bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-[#8a9663] focus:border-[#8a9663]"
                  value={graphPeriod}
                  onChange={(e) => setGraphPeriod(e.target.value as GraphPeriod)}
                  aria-label="Select time period for volunteer hours graph"
                  title="Select time period for volunteer hours graph"
                >
                  <option value="week">By Week</option>
                  <option value="month">By Month</option>
                  <option value="year">By Year</option>
                </select>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="5 5" />
                  <XAxis dataKey="name" stroke="#6b7547" />
                  <YAxis stroke="#6b7547" allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#8a9663"
                    strokeWidth={4}
                    activeDot={{ r: 8, fill: "#c27d50" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-10 w-full lg:w-1/2">
          <motion.div
            variants={fadeUp}
            className="bg-gradient-to-br from-white via-[#f9f8f4] to-[#f4f3ec] rounded-3xl p-8 shadow-2xl border border-[#cdd1bc] backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#6b7547] mb-6 drop-shadow-sm">
              Upcoming Events
            </h2>
            <ul className="space-y-4">
              {upcomingEvents.map((event) => {
                const signedUp = !!userSignups[event.id];

                return (
                  <li
                    key={event.id}
                    className="bg-gradient-to-r from-[#f4f3ec] to-[#f9f8f4] p-6 rounded-2xl shadow-sm border border-[#cdd1bc]/50 flex justify-between flex-col lg:flex-row items-start lg:items-center gap-4 hover:shadow-xl transition-all duration-300"
                  >
                    <div>
                      <p className="font-extrabold text-[#6b7547] text-xl drop-shadow-sm">
                        {event.title}
                      </p>
                      <p className="text-sm text-[#c27d50] font-medium">
                        {formatDate(event.date)} {event.time && `at ${event.time}`}
                      </p>
                      <p className="text-sm text-[#c27d50] font-medium">{event.location}</p>
                      {event.waiver_required && event.waiver_url && event.date >= todayStr && (
                        <>
                          <p className="text-xs mt-1 px-3 py-1 bg-red-100 text-red-700 rounded-full font-semibold w-fit">
                            Waiver Required
                          </p>
                          <p className="text-xs mt-1 text-red-700 font-semibold">
                            This event requires a signed waiver.{" "}
                            <a
                              href={event.waiver_url}
                              download
                              className="underline text-blue-700"
                              aria-label={`Download waiver PDF for ${event.title}`}
                              title={`Download waiver PDF for ${event.title}`}
                            >
                              Download Waiver PDF
                            </a>{" "}
                            and bring a signed copy in person.
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventModal(true);
                        }}
                        className="bg-[#f4f3ec] text-[#6b7547] font-semibold px-4 py-2 rounded-full border border-[#cdd1bc] hover:bg-[#e6e8d5] hover:text-[#525c32] transition-all duration-300 shadow-sm hover:shadow-md"
                        aria-label={`View details for ${event.title}`}
                        title={`View details for ${event.title}`}
                      >
                        View Details
                      </button>
                      {signedUp ? (
                        <button
                          type="button"
                          onClick={() => handleCancelSignup(event.id)}
                          disabled={signupLoading === event.id}
                          className="bg-[#c27d50] text-white px-4 py-2 rounded-full font-semibold hover:bg-[#a46336] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c27d50]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          aria-label={`Cancel signup for ${event.title}`}
                          title={`Cancel signup for ${event.title}`}
                        >
                          {signupLoading === event.id ? "Cancelling..." : "Cancel"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSignUp(event.id)}
                          disabled={signupLoading === event.id}
                          className="bg-[#8a9663] text-white px-4 py-2 rounded-full font-semibold hover:bg-[#7a8757] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#8a9663]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          aria-label={`Sign up for ${event.title}`}
                          title={`Sign up for ${event.title}`}
                        >
                          {signupLoading === event.id ? "Signing Up..." : "Sign Up"}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="bg-gradient-to-br from-white via-[#f9f8f4] to-[#f4f3ec] rounded-3xl p-6 shadow-2xl border border-[#cdd1bc] backdrop-blur-sm"
          >
            <h2 className="text-2xl font-extrabold text-[#6b7547] mb-4 drop-shadow-sm">
              Past Events
            </h2>
            <ul className="text-[#c27d50] space-y-2">
              {pastEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="text-sm font-medium bg-[#f4f3ec]/50 p-3 rounded-lg border border-[#cdd1bc]/30"
                >
                  <span className="font-semibold text-[#6b7547]">{ev.title}</span> —{" "}
                  {formatDate(ev.date)} {ev.time ? `at ${ev.time}` : ""}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="bg-gradient-to-br from-white via-[#f9f8f4] to-[#f4f3ec] rounded-3xl p-8 shadow-2xl border border-[#cdd1bc] backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#6b7547] mb-6 drop-shadow-sm">
              Volunteer Hours (Detailed)
            </h2>
            {volunteerHours.length === 0 ? (
              <p className="text-[#c27d50] italic font-medium">No volunteer hours recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-[#cdd1bc] rounded-xl text-[#6b7547] shadow-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#f4f3ec] to-[#f9f8f4]">
                      <th className="px-4 py-2 text-left">Event</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Time</th>
                      <th className="px-4 py-2 text-left">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteerHours.map((vh, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2">{vh.event?.title || "-"}</td>
                        <td className="px-4 py-2">
                          {vh.event?.date ? formatDate(vh.event.date) : "-"}
                        </td>
                        <td className="px-4 py-2">{vh.event?.time || "-"}</td>
                        <td className="px-4 py-2 font-bold">{vh.hours}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gradient-to-r from-[#f4f3ec] to-[#f9f8f4] font-extrabold text-[#6b7547]">
                      <td className="px-4 py-2" colSpan={3}>
                        Total
                      </td>
                      <td className="px-4 py-2">{totalHours}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showEventModal && !!selectedEvent}
        onClose={() => setShowEventModal(false)}
        title={selectedEvent?.title || "Event Details"}
        size="lg"
      >
        {selectedEvent && (
          <EventModalContent selectedEvent={selectedEvent} formatDate={formatDate} />
        )}
      </Modal>
    </motion.div>
  );
};

const EventModalContent = ({
  selectedEvent,
  formatDate,
}: {
  selectedEvent: EventWithImageUrl;
  formatDate: (dateStr: string, timeStr?: string) => string;
}) => {
  const isUpcomingEvent = selectedEvent.date >= new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Event Image */}
      {selectedEvent.image && (
        <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg">
          <img
            src={selectedEvent.imageUrl || ""}
            alt={selectedEvent.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      )}

      {/* Description */}
      {selectedEvent.description && (
        <div className="bg-[#f4f3ec]/50 p-4 rounded-xl border border-[#cdd1bc]/30">
          <p className="text-[#6b7547] leading-relaxed font-medium">{selectedEvent.description}</p>
        </div>
      )}

      {/* Event Details */}
      <div className="grid gap-4">
        {/* Date & Time */}
        <div className="flex items-start gap-3 bg-white/50 p-3 rounded-lg border border-[#cdd1bc]/30">
          <Calendar className="text-[#8a9663] mt-0.5 flex-shrink-0" size={18} />
          <p className="font-semibold text-[#6b7547]">{formatDate(selectedEvent.date)}</p>
        </div>
        {selectedEvent.time && (
          <div className="flex items-start gap-3 bg-white/50 p-3 rounded-lg border border-[#cdd1bc]/30">
            <Clock className="text-[#8a9663] mt-0.5 flex-shrink-0" size={18} />
            <p className="font-semibold text-[#6b7547]">{selectedEvent.time}</p>
          </div>
        )}

        {/* Location */}
        <div className="flex items-start gap-3 bg-white/50 p-3 rounded-lg border border-[#cdd1bc]/30">
          <MapPin className="text-[#8a9663] mt-0.5 flex-shrink-0" size={18} />
          <p className="text-[#6b7547] font-medium">{selectedEvent.location}</p>
        </div>

        {/* Waiver Info */}
        <div className="flex items-start gap-3 bg-white/50 p-3 rounded-lg border border-[#cdd1bc]/30">
          <FileText className="text-[#8a9663] mt-0.5 flex-shrink-0" size={18} />
          <div>
            <p className="font-semibold text-[#6b7547]">
              Waiver Required: {selectedEvent.waiver_required ? "Yes" : "No"}
            </p>

            {selectedEvent.waiver_required && selectedEvent.waiver_url && isUpcomingEvent && (
              <div className="mt-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 shadow-sm">
                <p className="text-sm text-red-800 font-semibold mb-2">⚠️ Waiver Required</p>
                <p className="text-sm text-red-700 mb-3 leading-relaxed">
                  This event requires a signed waiver. Please download, sign, and bring a copy with
                  you.
                </p>
                <a
                  href={selectedEvent.waiver_url}
                  download
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#c27d50] hover:text-[#a46336] bg-white px-3 py-2 rounded-lg border border-[#cdd1bc] hover:shadow-md transition-all duration-200"
                >
                  <FileText size={16} />
                  Download Waiver PDF
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signup Count Component */}
      <div className="pt-6 border-t border-[#cdd1bc]/50">
        <EventSignupCount eventId={selectedEvent.id} />
      </div>
    </div>
  );
};

const EventSignupCount = ({ eventId }: { eventId: string }) => {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from("event_signups")
        .select("id", { count: "exact" })
        .eq("event_id", eventId);
      setCount(count ?? 0);
    };
    fetchCount();
  }, [eventId]);

  return (
    <p className="mt-4 font-semibold text-[#6b7547]">
      Signed up volunteers: {count ?? "Loading..."}
    </p>
  );
};

export default Dashboard;
